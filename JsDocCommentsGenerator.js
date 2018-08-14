const fs = require('fs')
const path = require('path')

/**
* show usage of this tool
* @returns {void}
*/
function ShowHelp() {
    console.log(`Usage: JsDocCommentsGenerator <file/folder path> [<options>]...`)
    console.log(`Options:`)
    console.log(`   -s, --suffix <value,value,...>`)
    console.log(`       Only add comments to file with assigned suffixes. Default: .js,.ts`)
    console.log(`   -o, --output <value>`)
    console.log(`       The output path of files with comments. Default: ./out`)
    console.log(`   -e, --exclude <value,value,...>`)
    console.log(`       Exclude files/folders with assigned patterns. Default: node_modules`)
}

/**
* recursive make directories, will create non-exist parent directories when needed
* @param {string} dirname - directory name
* @param {Function} callback - callback function (if needed)
* @returns {void}
*/
function MakeDirs(dirname, callback) {
    fs.access(dirname, err => {
        if (!err) {
            if (callback) {
                callback()
            }
        } else {
            MakeDirs(path.dirname(dirname), function () {
                fs.mkdir(dirname, callback)
            })
        }
    })
}

/**
* generate comments by using template
* @param {string} blankSpace - blank space of current function, used to align
* @param {string} functionName - current function name (deprecated)
* @param {Array} params - function parameter lists
* @returns {string} function comment
*/
function GenerateCommentsByTemplates(blankSpace, functionName, params) {
    let comments = `\n${blankSpace}/**\n${blankSpace}* function_description_todo`
    for (let param of params) {
        if (param) {
            comments += `\n${blankSpace}* @param {param_type_todo} ${param.trim()} - param_description_todo`
        }
    }
    comments += `\n${blankSpace}* @returns {returns_type_todo} returns_description_todo`
    comments += `\n${blankSpace}*/`
    return comments
}

/**
* parse parameter string to parameter lists
* @param {string} paramStr - parameter string
* @returns {Array} parameter lists
*/
let ParseParams = function (paramStr) {
    let defaultParamPattern = /,\s*(\S+)\s*=/g
    let params = paramStr.substring(0, (paramStr.indexOf('=') === -1 ? paramStr.length : paramStr.indexOf('='))).split(',')
    let isFirst = true
    while ((param = defaultParamPattern.exec(paramStr)) != null) {
        // don't add the first, because it already in params
        if (isFirst) {
            params.push(param[1])
        }
        isFirst = false
    }
    return params
}

/**
* generate comments by using current regex pattern
* @param {string} originalCode - original code
* @param {RegExp} pattern - regex pattern
* @returns {string} code with comments
*/
let GenerateCommentsByPattern = function (originalCode, pattern) {
    let commentedCode = ''
    let lastIndex = 0
    while ((result = pattern.exec(originalCode)) != null) {
        let previousLine = result[1]
        // if already have comments in current function, ignore it
        if (previousLine.trimRight().endsWith('*/')) {
            continue
        }
        let blankSpace = result[2]
        let functionName = result[3]
        let paramStr = result[4]
        let params = ParseParams(paramStr)
        let curIndex = result.index + previousLine.length
        commentedCode += originalCode.substring(lastIndex, curIndex)
        lastIndex = curIndex
        commentedCode += GenerateCommentsByTemplates(blankSpace, functionName, params)
    }
    commentedCode += originalCode.substring(lastIndex)
    return commentedCode
}

/**
* generate comments from original code
* @param {string} originalCode - original code
* @returns {string} code with comments
*/
function GenerateCommentsInCode(originalCode) {
    // e.g. xxx function xxx()
    let functionPattern = /(\S*\s*)\n([\f\r\t\v ]*?)[^\n]*function\s+(\S+)\s*\((.*)\)/g
    // e.g. let xxx = function ()
    let anotherFunctionPattern = /(\S*\s*)\n([\f\r\t\v ]*?)[^\n]*?(\S+)[\f\r\t\v ]*=[\f\r\t\v ]*function\s*\((.*)\)/g
    let commentedCode = GenerateCommentsByPattern(originalCode, functionPattern)
    commentedCode = GenerateCommentsByPattern(commentedCode, anotherFunctionPattern)
    return commentedCode
}

/**
* add comments to file
* @param {string} file - current handling file path
* @param {string} outputPath - current output folder of generated files with comments
* @returns {void}
*/
function GenerateCommentsInFile(file, outputPath) {
    fs.readFile(file, 'utf-8', (err, data) => {
        if (err) {
            throw new Error(err)
        }
        let outputData = GenerateCommentsInCode(data)
        let outputFile = path.join(outputPath, path.basename(file))
        console.log(`Add comments to ${outputFile}`)
        MakeDirs(path.dirname(outputFile), () => {
            fs.writeFile(outputFile, outputData, err => {
                if (err) {
                    throw new Error(err)
                }
            })
        })
    })
}

/**
* add comments to file/folder
* @param {string} inputPath - input file/folder that need to add comments
* @param {string} outputPath - output root folder of generated files with comments
* @param {Array} suffixes - assigned suffix lists to add comments
* @param {Array} excludes - file/folder exclude pattern lists
* @returns {void}
*/
function GenerateComments(inputPath, outputPath = 'out', suffixes = ['.js', '.ts'], excludes = ['node_modules']) {
    for (let pattern of excludes) {
        if (RegExp(pattern).test(inputPath)) {
            return
        }
    }
    fs.stat(inputPath, (err, stats) => {
        if (err) {
            throw new Error(err)
        }
        if (stats.isDirectory()) {
            fs.readdir(inputPath, (err, files) => {
                if (err) {
                    throw new Error(err)
                }
                files.forEach(fileName => {
                    GenerateComments(path.join(inputPath, fileName), path.join(outputPath, path.basename(inputPath)), suffixes)
                })
            })
        } else {
            let suffix = path.extname(inputPath)
            if (suffixes.includes(suffix)) {
                // only handle file with assigned suffix
                GenerateCommentsInFile(inputPath, outputPath)
            }
        }
    })
}

/**
* main entry function that accepts arguments to generate comments
* @returns {void}
*/
function Main() {
    let args = process.argv.splice(2)
    if (!args || args.length % 2 === 0) {
        ShowHelp()
    } else {
        let inputPath = args[0]
        let outputPath
        let suffixes
        for (let index = 1; index < args.length; index += 2) {
            let optionKey = args[index]
            let optionValue = args[index + 1]
            switch (optionKey) {
                case '-s':
                case '--suffix':
                    suffixes = optionValue.split(',')
                    break
                case '-o':
                case '--output':
                    outputPath = optionValue
                    break
                case '-o':
                case '--output':
                    outputPath = optionValue
                    break
                default:
                    ShowHelp()
                    return
            }
        }
        GenerateComments(inputPath, outputPath, suffixes)
    }
}

Main()
