import React, { useContext } from 'react';
import { EditorContext } from '../pages/editor.pages';

const Tag = ({ tag, tagIndex }) => {
    let {
        blog,
        blog: { tags },
        setBlog,
    } = useContext(EditorContext);
    const handleClose = () => {
        tags = tags.filter((t) => t !== tag);
        setBlog({ ...blog, tags });
    };
    const handleTagEdit = (e) => {
        if (e.keyCode === 13 || e.keyCode === 188) {
            e.preventDefault();
            let newTag = e.target.innerText;
            if (tags.includes(newTag)) {
                return;
            } else {
                tags[tagIndex] = newTag;
                setBlog({ ...blog, tags });
                e.target.setAttribute('contenteditable', false);
            }
        }
        console.log(tags);
    };
    const addEditable = (e) => {
        e.target.setAttribute('contenteditable', true);
        e.target.focus();
    };

    return (
        <div className='relative p-2 rounded-full px-5 bg-white mr-2 inline-block hover:bg-opacity-50 pr-8'>
            <p
                className='outline-none'
                onClick={addEditable}
                onKeyDown={handleTagEdit}
            >
                {tag}
            </p>
            <button
                className='mt-[2px] absolute right-3 -translate-y-1/2 top-1/2'
                onClick={handleClose}
            >
                <i className='fi fi-br-cross text-base pointer-events-none'></i>
            </button>
            
        </div>
    );
};

export default Tag;
