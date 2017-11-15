var assert = require('assert')
var PDF2Pic = require('./../index')

var PDF2PicInstance = new PDF2Pic({
    savedir: "./test/o",
    savename: "tests",
    density: 72,
    size: "768x512",
    format: "png"
})

describe('PDF2Pic', () => {

    it("should not return private functions", function () { 
        this.timeout(100000)
        return assert(PDF2PicInstance.get("identify") === undefined, "undefined is returned")
    })

    it("should return private properties", function () { 
        this.timeout(100000)
        return assert(PDF2PicInstance.get("quality") !== undefined, "undefined is returned")
    })

    it("should not set private functions", function () { 
        this.timeout(100000)
        PDF2PicInstance.set("identify", "asd")
        return assert(PDF2PicInstance.get("identify") === undefined, "undefined is returned")
    })

    it("should set private properties", function () { 
        this.timeout(100000)
        PDF2PicInstance.set("savedir", "./test/o/test_1")
        return assert(PDF2PicInstance.get("savedir") == "./test/o/test_1", "savedir is returned")
    })

    it("should convert pdf1 first page", function () {
        this.timeout(100000)
        PDF2PicInstance.set("savedir", "./test/o/test_1")
        PDF2PicInstance.set("savename", "first")
        PDF2PicInstance.convert("./test/docs/pdf1.pdf").then(resolve => {
            console.log('@test-1:', resolve.name)
            return assert(resolve.size > 0, "conversion is successful")
        })
    })
    
    it("should convert pdf1 second page", function () {
        this.timeout(100000)
        PDF2PicInstance.set("savedir", "./test/o/test_2")
        PDF2PicInstance.set("savename", "second")
        PDF2PicInstance.convert("./test/docs/pdf1.pdf", 2).then(resolve => {
            console.log('@test-2:', resolve.name)
            return assert(resolve.size > 0, "conversion is successful")
        })
    })

    it("should convert pdf1 all pages", function () { 
        this.timeout(100000)
        PDF2PicInstance.set("savedir", "./test/o/test_3")
        PDF2PicInstance.set("savename", "third")
        PDF2PicInstance.convertBulk("./test/docs/pdf1.pdf", -1).then(resolve => {
            console.log('@test-3:', resolve.length)
            return assert(resolve.length > 0, "conversion is successful")
        })
    })

    it("should convert pdf1 page 1 5 and 8", function () { 
        this.timeout(100000)
        PDF2PicInstance.set("savedir", "./test/o/test_4")
        PDF2PicInstance.set("savename", "fourth")
        PDF2PicInstance.convertBulk("./test/docs/pdf1.pdf", [1,5,8]).then(resolve => {
            console.log('@test-4:', resolve.length)
            return assert(resolve.length === 3, "conversion is successful")
        })
    })

    it("should convert all huge_size pages to pdf", function () { 
        this.timeout(100000)
        PDF2PicInstance.set("savedir", "./test/o/test_5")
        PDF2PicInstance.set("savename", "fifth")
        PDF2PicInstance.convertBulk("./test/docs/huge size.pdf").then(resolve => {
            console.log('@test-5:', resolve.length)
            return assert(resolve.length > 0, "conversion is successful")
        })
    })

    it("should convert pdf1 first page to base64", function () { 
        this.timeout(100000)
        PDF2PicInstance.set("savename", "sixth")
        PDF2PicInstance.convertToBase64("./test/docs/pdf1.pdf").then(resolve => {
            console.log('@test-6:', resolve.page)
            return assert(resolve.page, "conversion is successful")
        })
    })

    it("should convert all pages of pdf1 to base64", function () { 
        this.timeout(100000)
        PDF2PicInstance.set("savename", "seventh")
        PDF2PicInstance.convertToBase64Bulk("./test/docs/pdf1.pdf").then(resolve => {
            console.log('@test-7:', resolve.length)
            return assert(resolve.length, "conversion is successful")
        })
    })

})