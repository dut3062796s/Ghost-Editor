import Ember from 'ember';
import layout from '../templates/components/ghost-toolbar';

import Tools from '../options/default-tools';

export default Ember.Component.extend({
    layout,
    classNames: ['toolbar'],
    classNameBindings: ['isVisible'],
    isVisible: false,
    tools: [],
    isLink: Ember.computed({
        get() {
            return this._isLink;
        },
        set(_, value) {
            this._isLink = value;
            return this._isLink;
        }
    }),
    toolbar: Ember.computed(function () {
        // TODO if a block section other than a primary section is selected then
        // the returned list removes one of the primary sections to compensate,
        // so that there are only ever four primary sections.
        let visibleTools = [ ];

        this.tools.forEach(tool => {
            if (tool.type === 'markup') {
                visibleTools.push(tool);
            }
        });

        return visibleTools;
    }).property('tools.@each.selected'),
    init() {
        this._super(...arguments);
        this.tools =new Tools(this.get('editor'), this);
        this.iconURL = this.get('assetPath') + '/tools/';
    },
    didRender() {
        let $this = this.$();
        let editor = this.editor;
        let $editor = Ember.$('.gh-editor-container'); // TODO - this element is part of ghost-admin, we need to seperate them more.

        if(!editor.range || editor.range.head.isBlank) {
            this.set('isVisible', false);
        }

        editor.cursorDidChange(() => {
            // if there is no cursor:
            if((!editor.range || editor.range.head.isBlank)) {
                if(!this.get('isLink')) {
                    this.set('isVisible', false);
                }
                return;
            }
            this.propertyWillChange('toolbar');

                if(!editor.range.isCollapsed) {
                    // if we have a selection, then the toolbar appears just below said selection:

                    let range = window.getSelection().getRangeAt(0); // get the actual range within the DOM.
                    let position =  range.getBoundingClientRect();
                    let edOffset = $editor.offset();

                    this.set('isVisible', true);
                    $this.css('top', position.top + $editor.scrollTop() - $this.height()-20); //- edOffset.top+10
                    $this.css('left', position.left + (position.width / 2) + $editor.scrollLeft() - edOffset.left - ($this.width()/2));

                    this.set('isLink', false);

                    this.tools.forEach(tool => {
                        if (tool.hasOwnProperty('checkElements')) {
                            // if its a list we want to know what type
                            let sectionTagName = editor.activeSection._tagName === 'li' ? editor.activeSection.parent._tagName : editor.activeSection._tagName;
                            tool.checkElements(editor.activeMarkups.concat([{tagName: sectionTagName}]));
                        }
                    });



                } else {
                    if(this.isVisible) {
                        this.set('isVisible', false);
                        this.set('isLink', false);
                    }


                }

            this.propertyDidChange('toolbar');
        });
    },
    willDestroyElement() {
        this.editor.destroy();
    },
    actions: {
        linkKeyDown(event) {
            // if escape close link
            if (event.keyCode === 27) {
                this.set('isLink', false);
            }
        },
        linkKeyPress(event) {
            // if enter run link
            if (event.keyCode === 13) {
                this.set('isLink', false);

                this.editor.run(postEditor => {
                    let markup = postEditor.builder.createMarkup('a', {href: event.target.value});
                    postEditor.addMarkupToRange(this.get('linkRange'), markup);
                });

                this.set('linkRange', null);
                event.stopPropagation();
            }
        }
    },
    doLink(range) {

        this.set('isLink', true);
        this.set('linkRange', range);
    }
});
