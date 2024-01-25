import React, { useState } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw, Modifier } from 'draft-js';
import 'draft-js/dist/Draft.css';
import Title from './Title';
import Button from './Button';

const MyEditor = () => {
  const [editorState, setEditorState] = useState(() => {
    // Initialize the editor state from local storage or create a new one
    const storedState = localStorage.getItem('editorState');
    return storedState ? EditorState.createWithContent(convertFromRaw(JSON.parse(storedState))) : EditorState.createEmpty();
  });

  // Update the editor state and save it to local storage
  const onChange = (newEditorState) => {
    setEditorState(newEditorState);
    localStorage.setItem('editorState', JSON.stringify(convertToRaw(newEditorState.getCurrentContent())));
  };

  // Handle keyboard commands for formatting
  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  // Handle before input for markdown syntax
  const handleBeforeInput = (chars, editorState) => {
    // Get the current selection and block
    const selection = editorState.getSelection();
    const block = editorState.getCurrentContent().getBlockForKey(selection.getStartKey());
    // Get the text before the input
    const start = selection.getStartOffset();
    const text = block.getText().slice(0, start);
    let newState;
    
    // Check if the input is a space after a markdown character
    if (chars === ' ' && text.match(/^[*#]+$/)) {
      // Get the length of the markdown character
      const length = text.length;
      // Apply the corresponding style to the block   
      switch (length) {
        case 1: // * for bold and header
          if(text === '#'){
            newState = RichUtils.toggleBlockType(editorState, 'header-one');
          }else{
            newState = RichUtils.toggleInlineStyle(editorState, 'BOLD');
          }
          break;
        case 2: // ** for red
          newState = RichUtils.toggleInlineStyle(editorState, 'RED');
          break;
        case 3: // *** for underline
          newState = RichUtils.toggleInlineStyle(editorState, 'UNDERLINE');
          break;
        default:
            break;
      }
      // Remove the markdown character from the text
      const contentState = newState.getCurrentContent();
      // Replace the # character with an empty string
      const newContentState = Modifier.replaceText(
        contentState, 
        selection.merge({
          anchorOffset: 0,
          focusOffset: start,
        }), '');
      // Apply the new content state
      newState = EditorState.push(newState, newContentState, 'change-block-type');
      // Update the editor state
      onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  // Save the editor state to local storage manually
  const saveEditorState = () => {
    localStorage.setItem('editorState', JSON.stringify(convertToRaw(editorState.getCurrentContent())));
    alert('Editor state saved!');
  };

  return (
    <div className="container">
      <div className='header'>
        <Title />
        <Button onClick={saveEditorState} label={"Save"} />
      </div>
      <div className="editor">
        <Editor
          editorState={editorState}
          onChange={onChange}
          handleKeyCommand={handleKeyCommand}
          handleBeforeInput={handleBeforeInput}
          customStyleMap={{ RED: { color: 'red' } }} // Custom inline style for red text
        />
      </div>
    </div>
  );
};

export default MyEditor;
