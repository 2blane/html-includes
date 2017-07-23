'use babel';

import HtmlIncludesView from './html-includes-view';
import { CompositeDisposable } from 'atom';

export default {

  htmlIncludesView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.htmlIncludesView = new HtmlIncludesView(state.htmlIncludesViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.htmlIncludesView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'html-includes:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.htmlIncludesView.destroy();
  },

  serialize() {
    return {
      htmlIncludesViewState: this.htmlIncludesView.serialize()
    };
  },

  toggle() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      let selection = editor.getSelectedText()
      let reversed = selection.split('').reverse().join('')
      editor.insertText(reversed)
    }
    /*console.log('HtmlIncludes was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );*/
  }

};
