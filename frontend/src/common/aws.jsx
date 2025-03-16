import axios from 'axios';

export const uploadImage = async (img) => {
    try {
        const { data } = await axios.get(
            import.meta.env.VITE_SERVER_DOMAIN + '/get-upload-url'
        );
        const uploadUrl = data.uploadUrl;

        await axios.put(uploadUrl, img, {
            headers: { 'Content-Type': img.type },
        });

        return uploadUrl.split('?')[0];
    } catch (error) {
        console.error('Image upload failed:', error);
    }
};
