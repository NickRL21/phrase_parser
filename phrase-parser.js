#!/usr/bin/env node


const readline = require('readline');
const fs = require('fs');
const { once } = require('events');


function lineToWords(line) {
    // convert line to lower case then use regex to replace all punctuation with empty string then split into words at whitespace
    // also removes single quotes that are not used as apostrophes
    return line.toLowerCase()
        .toLowerCase()
        .replace(/[,.?/!@#$%^&*()\-_\[\]{}|:;"]|(?<=\s)'|'(?=\s)/g, "")
        .split(/\s+/g);
}


function phraseCountIncrement(phrase, map) {
    // increment count if phrase already in map. Add to map if not found
    let count = 0;
    if (map.has(phrase)) {
        count = map.get(phrase);
    }
    map.set(phrase, count + 1);
}

function mergeCounters(mapOne, mapTwo) {
    // merge two maps together that are used as counters summing the counts
    mapTwo.forEach((value, key) => {
        let count = 0;
        if (mapOne.has(key)) {
            count = mapOne.get(key);
        }
        mapOne.set(key, value + count);
    });
    return mapOne;
}

function processLine(line, phraseBuffer, phraseCounts) {
    // processes single line of text
    const words = lineToWords(line);
    // process each word in the line
    for (let word of words) {
        if (word) {
            phraseBuffer.push(word);

            // when buffer length exceeds 3 remove the first word
            if (phraseBuffer.length > 3) {
                phraseBuffer.shift();
            }

            // add current phrase to counts
            if (phraseBuffer.length === 3) {
                phraseCountIncrement(phraseBuffer.join(" "), phraseCounts);
            }
        }
    }
}


async function processPipedData() {
    const phraseCounts = new Map();
    // Check if a text terminal is attached. 
    // If no terminal attached running with file piped in.
    if (!process.stdin.isTTY) {
        const phraseBuffer = [];
        const lineReader = readline.createInterface({
            input: process.stdin,
            crlfDelay: Infinity,
        })
        // process line by line
        lineReader.on('line', (line) => {
            processLine(line, phraseBuffer, phraseCounts)
        })

        await once(lineReader, "close");
    }
    return phraseCounts
}


async function processFileData(filePath) {
    const phraseCounts = new Map();
    const phraseBuffer = [];
    // initialize file I/O
    const fileStream = fs.createReadStream(filePath);
    const lineReader = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    lineReader.on('line', (line) => {
        processLine(line, phraseBuffer, phraseCounts)
    })

    await once(lineReader, "close");

    return phraseCounts;
}


function gatherAndPrintResults(files) {
    let finalMap;
    if (files.length > 0) {
        // Combine counting maps from each file into one counter
        finalMap = files[0];
        for (let i = 1; i < files.length; i++) {
            if (files[i] !== undefined) {
                finalMap = mergeCounters(finalMap, files[i]);
            }
        }

        // sort the results based on count
        const resultList = Array.from(finalMap.entries());
        resultList.sort((a, b) => {
            return a[1] - b[1]
        })

        // print up to the top 100 most common phrases to console
        for (let i = resultList.length - 1; i >= 0 && i >= resultList.length - 100; i--) {
            console.log(`${resultList[i][0]} - ${resultList[i][1]}`);
        }

    }
    if (finalMap.size === 0) {
        console.log("No phrases found.");
    }
}


async function main() {
    const args = process.argv.slice(2);

    // start processing of any piped in data
    const resultPromises = [processPipedData()];
    let finished_maps;

    // start each file processing tracking associated promises with resultPromises
    if (args.length > 0) {
        for (let arg of args) {
            const result = processFileData(arg);
            if (result !== null) {
                resultPromises.push(result);
            }
        }
    }

    // wait for all file processing to be done
    await Promise.all(resultPromises).then((values) => {
        finished_maps = values;
    }).catch((err) => {
        console.log("Failed to process files");
        console.log("error: ", err);
    })

    // add up and print the results to the console
    gatherAndPrintResults(finished_maps);
}

main();
