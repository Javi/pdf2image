import "gm-base64"
import Promise from "bluebird"
import gm from "gm"
import path from "path"
import fs from "fs-extra"
import Private from "private-props"

class PDF2Pic {
    constructor(options) {
        Private(this).quality       = 0
        Private(this).format        = options.format        || "png"
        Private(this).size          = options.size          || "768x512"
        Private(this).density       = options.density       || 72
        Private(this).savedir       = options.savedir       || undefined
        Private(this).savename      = options.savename      || undefined
        Private(this).compression   = options.compression   || "jpeg"
        Private(this).gm            = options.imageMagick === true 
                                    ? gm.subClass({imageMagick: true}) 
                                    : gm
                                    
        /**
         * GM command - identify
         * @access private
         * @param {String} file_path path to valid file
         * @param {Mixed} argument gm identify argument
         * @return {Promise} 
         */
        Private(this).identify = (file_path, argument = undefined) => {
            let image = Private(this).gm(file_path)
            
            return new Promise((resolve, reject) => {
                if(argument)
                    image.identify(argument, (error, data) => {
                        if(error)
                            return reject(error)

                        return resolve(data)
                    })
                else
                    image.identify((error, data) => {
                        if(error)
                            return reject(error)

                        return resolve(data)
                    })  
            })
        }

        /**
         * GM command - write
         * @access private
         * @param {Stream} stream
         * @param {String} output
         * @param {String} filename
         * @param {Integer} page
         * @return {Promise} 
         */
        Private(this).writeImage = (stream, output, filename, page) => {
            return new Promise((resolve, reject) => {
                Private(this).gm(stream, filename)
                    .density(Private(this).density, Private(this).density)
                    .resize(Private(this).size)
                    .quality(Private(this).quality)
                    .compress(Private(this).compression)
                    .write(output, (error) => {
                        if(error)
                            return reject(error)

                        return resolve({
                            name: path.basename(output),
                            size: fs.statSync(output)['size'] / 1000.0,
                            path: output,
                            page
                        })
                  })
            })
        }

        /**
         * GM command - toBase64
         * @access private
         * @param {Stream} stream
         * @param {String} output
         * @param {String} filename
         * @param {Integer} page
         * @return {Promise} 
         */
        Private(this).toBase64 = (stream, filename, page) => {
            return new Promise((resolve, reject) => {
                Private(this).gm(stream, filename)
                    .density(Private(this).density, Private(this).density)
                    .resize(Private(this).size)
                    .quality(Private(this).quality)
                    .compress(Private(this).compression)
                    .toBase64(Private(this).format, (error, base64) => {
                        if(error)
                            return reject(error)

                        return resolve({
                            base64,
                            page
                        })
                  })
            })
        }

    }

    /**
     * Intialize converter
     * @param {String} pdf_path path to file
     * @param {Page} page page number to be converted
     * @return {Object} image status
     */
    async convert(pdf_path, page = 1) {
        this.isValidPDF(pdf_path)
        this.fileExists(pdf_path)

        let output = path.basename(pdf_path, path.extname(path.basename(pdf_path)))

        // Set output dir
        if (this.get("savedir"))
            this.set("savedir", this.get("savedir") + path.sep)
        else
            this.set("savedir", output + path.sep)
        
        fs.mkdirsSync(this.get("savedir"))

        if(!this.get("savename"))
            this.set("savename", output)

        let pages = await this.getPageCount(pdf_path)

        if(page > pages)
            throw {error: "InvalidPageSelection", message: "Cannot convert non-existent page"}
        
        return await this.toImage(pdf_path, page)
    }

    /**
     * Intialize pdftobase64 converter
     * @param {String} pdf_path path to file
     * @param {Page} page page number to be converted
     * @return {Object} image status
     */
    async convertToBase64(pdf_path, page = 1) {
        this.isValidPDF(pdf_path)
        this.fileExists(pdf_path)

        let output = path.basename(pdf_path, path.extname(path.basename(pdf_path)))

        // Set output dir
        if (this.get("savedir"))
            this.set("savedir", this.get("savedir") + path.sep)
        else
            this.set("savedir", output + path.sep)
        
        fs.mkdirsSync(this.get("savedir"))

        if(!this.get("savename"))
            this.set("savename", output)

        let pages = await this.getPageCount(pdf_path)

        if(page > pages)
            throw {error: "InvalidPageSelection", message: "Cannot convert non-existent page"}
        
        return await this.toBase64(pdf_path, page, true)
    }

    /**
     * Intialize pdftobase64 converter, well the bulk version
     * @param {String} pdf_path path to file
     * @param {Page} page page number to be converted (-1 for all pages)
     * @return {Object} image status
     */
    async convertToBase64Bulk(pdf_path, pages = -1) {
        let result = []
        
        pages = pages === -1 ? await this.getPage(pdf_path) : (Array.isArray(pages) ? pages : [1])

        pages = pages.map(page => {
            return this.convertToBase64(pdf_path, page)
        })
        
        result = await Promise.all(pages)
                
        return result
    }

    /**
     * Intialize converter, well the bulk version
     * @param {String} pdf_path path to file
     * @param {Page} page page number to be converted (-1 for all pages)
     * @return {Object} image status
     */
    async convertBulk(pdf_path, pages = -1) {
        let result = []

        pages = pages === -1 ? await this.getPage(pdf_path) : (Array.isArray(pages) ? pages : [1])

        /** not sure yet if this would work */
        pages = pages.map(page => {
            return this.convert(pdf_path, page)
        })

        result = await Promise.all(pages)
        
        return result
    }

    /**
     * Get how many pages are there in the pdf file
     * @param {String} pdf_path path to file
     * @return {Integer} number of pages
     */
    async getPageCount(pdf_path) {
        return await this.getPage(pdf_path).length
    }

    /**
     * Get pages numbers
     * @param {String} pdf_path path to file
     * @return {Array} pages
     */
    async getPage(pdf_path) {
        let page = await Private(this).identify(pdf_path, "%p ")
        
        return page.split(" ")
    }

    /**
     * Converts pdf to image
     * @param {String} pdf_path 
     * @param {Integer} page
     * @return {Promise} 
     */
    async toImage(pdf_path, page = 1) {
        let iStream  = fs.createReadStream(pdf_path)
        let file     = `${this.get("savedir")}${this.get("savename")}_${page}.${this.get("format")}`
        let filename = `${this.getFilePath(iStream)}[${page - 1}]`

        return await Private(this).writeImage(iStream, file, filename, page)
    }

    /**
     * Converts pdf to image
     * @param {String} pdf_path 
     * @param {Integer} page
     * @return {Promise} 
     */
    async toBase64(pdf_path, page = 1) {
        let iStream  = fs.createReadStream(pdf_path)
        let filename = `${this.getFilePath(iStream)}[${page - 1}]`

        return await Private(this).toBase64(iStream,filename, page)
    }

    /**
     * Get file path
     * @param {Stream} stream
     * @return {String} path
     */
    getFilePath(stream) {
        if(!stream)
            throw {error: "InvalidPath", message: "Invalid Path"}

        return stream.path
    }

    /**
     * Checks if the supplied file has the exact file format
     * @param {String} pdf_path path to file
     * @return {Mixed} file status
     */
    isValidPDF(pdf_path) {
        if (path.extname(path.basename(pdf_path)) != '.pdf') 
            throw {error: "InvalidPDF", message: "File supplied is not a valid PDF"}
        
        return true
    }

    /**
     * Checks if the supplied file has exists
     * @param {String} pdf_path path to file
     * @return {Mixed} file status
     */
    fileExists(pdf_path) {
        if(!fs.existsSync(pdf_path))
            throw {error: "FileNotFound", message: "File supplied cannot be found"}

        return true
    }

    /**
     * Get value from private property
     * @param {String} property
     * @return {Mixed} value of the property 
     */
    get(property) {
        if(Object.prototype.toString.call(Private(this)[property]) == '[object Function]')
            return undefined

        return Private(this)[property]
    }

    /**
     * Add/set value as private property
     * @param {String} property 
     * @param {String} value
     * @return {Object} this 
     */
    set(property, value) {
        if(this.get(property) !== undefined)
           Private(this)[property] = value

        return this
    }
}

module.exports = PDF2Pic