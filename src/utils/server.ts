/* Defines tools that require `vscode-languageserver` module */

import { TextDocument,
        Range,
        Position } from 'vscode-languageserver';

/**
    Check if a given `document` is a SystemVerilog file.

    @param document the document to check
    @return true if the document is a SystemVerilog file
*/
export function isSystemVerilogDocument(document: TextDocument): boolean {
    if (!document) {
        return false;
    }

    if (document.languageId === "vhdl") { //FIXME
        return true;
    }

    return false;
}

/**
    Check if a given `document` is a Verilog file.

    @param document the document to check
    @return true if the document is a Verilog file
*/
export function isVerilogDocument(document: TextDocument): boolean {
    if (!document) {
        return false;
    }

    if (document.languageId === "vhdl") { //FIXME
        return true;
    }

    return false;
}

/**
    Check if a given `document` is a Vhdl file.

    @param document the document to check
    @return true if the document is a Verilog file
*/
export function isVhdlDocument(document: TextDocument): boolean {
    if (!document) {
        return false;
    }

    if (document.languageId === "vhdl") {
        return true;
    }

    return false;
}

/** 
        Gets the `range` of a line given the line number

        @param line the line number
        @return the line's range
    */
export function getLineRange(line: number, offendingSymbol: string, startPosition: number): Range {
    let endPosition: number;
    if (startPosition == null && offendingSymbol == null) {
        startPosition = 0;
        endPosition = Number.MAX_VALUE;
    } else {
        endPosition = startPosition + offendingSymbol.length;
    }
    return Range.create(Position.create(line, startPosition), Position.create(line, (endPosition)));
}