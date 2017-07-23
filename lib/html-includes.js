'use babel';

import {existsSync, readFileSync, writeFileSync} from 'fs';
import {join, relative, dirname, extname, normalize, parse} from 'path';
import {exec} from 'child_process';

import { CompositeDisposable } from 'atom';

const CONFIGS_FILENAME = '.html-includes.json';
const EXEC_TIMEOUT = 60 * 1000; // 1 minute

const EXTENSION = "anomalous";

const STARTSTRING = '<partial';
const STARTSUBSTRING = 'src="';
const ENDSUBSTRING = '"';
const STARTSUBSTRINGALT = "src='";
const ENDSUBSTRINGALT = "'";
const ENDSTRING = '/>';

export default {

  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    console.log("activating");
    this.subscriptions = new CompositeDisposable();
    // Register an on-save command
    this.subscriptions.add(
      atom.workspace.observeTextEditors(textEditor => {
        this.subscriptions.add(textEditor.onDidSave(this.handleDidSave.bind(this)));
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  handleDidSave(event) {
    let editor;
    let replacementsMade = 0;
    if (editor = atom.workspace.getActiveTextEditor()) {
      let fileName = event.path;
      console.log(fileName);
      let extension = fileName.split('.').pop();
      console.log(extension);
      if (extension === EXTENSION) {
        //we need to compile this file
        let text = editor.getText();

        while (true) {
          //continually replace the partials for <partial src="" />
          let startIndex = text.indexOf(STARTSTRING);
          let globalEnd = 0;
          if (startIndex >= 0) {
            //we found a partial to replace

            //now get the src variable
            let rest = text.substr(startIndex + STARTSTRING.length);
            globalEnd += STARTSTRING.length;

            let alt = false;
            let srcIndex = rest.indexOf(STARTSUBSTRING);
            if (srcIndex < 0) {
              alt = true
              srcIndex = rest.indexOf(STARTSUBSTRINGALT);
            }
            globalEnd += srcIndex;
            if (srcIndex >= 0) {
              //now find where the substring ends
              let srcEndIndex;
              if (!alt) {
                globalEnd += STARTSUBSTRING.length;
                rest = rest.substr(srcIndex + STARTSUBSTRING.length);
                srcEndIndex = rest.indexOf(ENDSUBSTRING);
              } else {
                globalEnd += STARTSUBSTRINGALT.length;
                rest = rest.substr(srcIndex + STARTSUBSTRINGALT.length);
                srcEndIndex = rest.indexOf(ENDSUBSTRINGALT);
              }

              if (srcEndIndex > 0) {
                //now find the ending string for the partial
                let endIndex = rest.indexOf(ENDSTRING);
                globalEnd += endIndex + ENDSTRING.length;
                if (endIndex >= 0) {
                  //we can now get the file string
                  let replacementFileName = rest.substr(0, srcEndIndex).trim();
                  console.log(replacementFileName);
                  res = this.replaceStringWithFileContents(text, startIndex, globalEnd, fileName, replacementFileName);
                  if (res[0] == true) {
                    text = res[1];
                    replacementsMade += 1;
                  } else {
                    break;
                  }
                } else {
                  //Error, no ending tag />
                  atom.notifications.addError("No ending tag for your partial use />");
                  break;
                }
              } else {
                //Error no ending src attribute
                atom.notifications.addError("No ending quote for the src attribute in your partial");
                break;
              }
            } else {
              //Error no starting src attribute
              atom.notifications.addError("No src attribute in your partial");
              break;
            }
          } else {
            break;
          }
        }

        //copy the file to html
        let parsed = parse(fileName);
        let dir = parsed["dir"];
        let name = parsed["name"];
        console.log("dir: " + dir);
        console.log("name: " + name);

        let newPath = join(dir, name + ".html")
        console.log("newFile: " + newPath);

        //now write the text to an html file
        writeFileSync(newPath, text);
      }
      if (replacementsMade == 1) {
        atom.notifications.addSuccess("Successfully combined " + replacementsMade + " partial.");
      } else if (replacementsMade > 1) {
        atom.notifications.addSuccess("Successfully combined " + replacementsMade + " partials.");
      }
    }
  },

  replaceStringWithFileContents(str, startPos, length, currentFilePath, replaceFilePath) {
    console.log("startPos: " + startPos);
    console.log("length: " + length);
    console.log("currentFilePath: " + currentFilePath);
    console.log("replaceFilePath: " + replaceFilePath);

    //get the relative file path
    let dir = dirname(currentFilePath);
    console.log("dir: " + dir);
    let joined = join(dir, replaceFilePath);
    console.log("combined: " + joined);
    let normalized = normalize(joined);
    console.log("normalized: " + normalized);

    //now open the file and read the text
    if (existsSync(normalized)) {
      let fileText = readFileSync(normalized, 'utf8');
      //now replace the text
      str = str.substr(0, startPos) + fileText + str.substr(startPos + length);
    } else {
      atom.notifications.addError("Partial file doesn't exist: " + normalized);
      return [false, str];
    }
    return [true, str];
  }
};
