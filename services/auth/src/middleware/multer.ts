import multer from 'multer'

const storage = multer.memoryStorage()
// save file in memory (RAM)

const uploadFile = multer({ storage }).single('file')
// only choice one file with the name 'file' in the form data

export default uploadFile
