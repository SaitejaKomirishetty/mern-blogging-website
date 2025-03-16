// importing tools

import Embed from '@editorjs/embed';
import List from '@editorjs/list';
import Image from '@editorjs/image';
import Header from '@editorjs/header';
import Marker from '@editorjs/marker';
import Quote from '@editorjs/quote';
import InlineCode from '@editorjs/code';

import { uploadImage } from '../common/aws';

const uploadImageByUrl = (url) => {
    return Promise.resolve(url)
        .then((resolvedUrl) => {
            return {
                success: 1,
                file: { url: resolvedUrl },
            };
        })
        .catch((err) => {
            console.error('URL upload error:', err);
            return {
                success: 0,
                message: 'URL upload failed',
            };
        });
};

const uploadImageByFile = (e) => {
    return uploadImage(e)
        .then((url) => {
            if (url) {
                return {
                    success: 1,
                    file: { url },
                };
            } else {
                throw new Error('Upload failed, no URL returned');
            }
        })
        .catch((err) => {
            console.error('Upload error:', err);
            return {
                success: 0,
                message: 'Image upload failed',
            };
        });
};

export const tools = {
    embed: Embed,
    list: { class: List, inlineToolbar: true },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadImageByUrl,
                uploadByFile: uploadImageByFile,
            },
        },
    },
    header: {
        class: Header,
        config: {
            placeholder: 'Type Heading.....',
            levels: [2, 3],
            defaultLevel: 2,
        },
    },
    quote: { class: Quote, inlineToolbar: true },
    marker: Marker,
    inlineCode: InlineCode,
};
