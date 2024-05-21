# Phrase Parser
Node.js based command line tool for getting the 100 most common three word sequences in a text file.

## Running The Program
**Requirements**
 - Node.js Installation
 - Setting script file permissions to allow execution (Optional) e.g. on unix systems `chmod +x phrase-parser.js`
 
**Running with executable permission** 
Running with single file
`./phrase-parser.js <path_to_file>`
Running with cat output piped to script
`cat <path_to_file>| ./phrase-parser.js`
Running with cat output piped to script and with multiple file paths specified
`cat <path_to_file> | ./phrase-parser.js <path_to_file> <path_to_file> <path_to_file>`

**Running without executable permission**

     cat <path_to_file> | node ./phrase-parser.js <path_to_file>

## What I would do Next
The reading and processing of lines from files is already done using streams asynchronously so memory used to read the files is minimal and the processing can start without waiting for the file to be read in its entirety. While this is already fairly performant the next thing I would change would be to only read a file a single time if the same file path was provided multiple times. This would save on processing time and save a lot of memory used to store the phrases for each file during execution. This change would allow for a file to be read once and the results would just need to be multiplied by the number of occurrences of the file. 

Another issue with performance that could be improved upon is the maps used to count the phrases are very fast but consume quite a bit of memory as a trade off. Solving this problem could potentially be done by using a single counter map however this would have to be done very carefully to prevent race conditions due to the async nature of the code.

Another thing I would do after that would be to implement proper unit testing to increase confidence in its results and to reduce test time as it is all currently manual at the moment. 

## Known Issues
A current issue with the parsing of the text files would be encoutered with text that contains hyphenated words with the rest of the word on a newline. I have noticed this is common in books. 
**e.g**
    some continu-\ned words
This would currently be parsed as the phrase "some continu ed" instead of correct parsing of " some continued words"


