# JsDocCommentsGenerator

- Generate code comments used for JsDoc

- Usage: `JsDocCommentsGenerator <file/folder path> [<options>]...`
- Options:
    ```bash
   -s, --suffix <value,value,...>
       Only add comments to file with assigned suffixes. Default: .js,.ts
   -o, --output <value>
       The output path of files with comments. Default: ./out
   -e, --exclude <value,value,...>
       Exclude files/folders with assigned patterns. Default: node_modules
    ```
