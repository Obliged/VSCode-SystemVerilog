import { SymbolInformation, SymbolKind, Location } from "vscode";

export class SystemVerilogSymbol extends SymbolInformation {
    public type: string;

    /**
     * Creates a new symbol information object.
     *
     * @param name The name of the symbol.
     * @param type The name of the symbol.
     * @param containerName The name of the symbol containing the symbol.
     * @param location The location of the symbol.
     */
    constructor(name: string, type: string, containerName: string, location: Location) {
        super(name, getSymbolKind(type), containerName, location);
        this.type = type;
    }
}

// See docs/SymbolKind_icons.png for an overview of the available icons
// Use show_SymbolKinds to see the latest symbols
export function getSymbolKind(name: string): SymbolKind {
    if (name === undefined || name === '') { // Ports may be declared without type
        return SymbolKind.Variable;
    } else if (name.indexOf('(') != -1) {
        return  SymbolKind.Array;
    }
    switch (name) {
        case 'constant': return SymbolKind.Constant;
        case 'library':
        case 'package body':
        case 'package':
        case 'use': return SymbolKind.Package;
        case 'begin': // Labels
        case 'string': return SymbolKind.String;
        case 'procedure': return SymbolKind.Method;
        case 'function': return SymbolKind.Function;
        case 'assert':
        case 'record': return SymbolKind.Struct;
        case 'type': return SymbolKind.TypeParameter;
        case 'subtype': return SymbolKind.TypeParameter;
        case 'array': return SymbolKind.Array;
        case 'unsigned':
        case 'signed':
        case 'bit':
        case 'bit_vector':
        case 'std_logic':
        case 'std_logic_vector':
        case 'std_ulogic':
        case 'std_ulogic_vector':
        case 'integer':
        case 'integer_vector':
        case 'time':
        case 'time_vector':
        case 'boolean':
        case 'boolean_vector':
        case 'real':
        case 'real_vector': return SymbolKind.Variable;
        case 'entity':
        default: return SymbolKind.Field;
    }
    /* Unused/Free SymbolKind icons
        return SymbolKind.Number;
        return SymbolKind.Enum;
        return SymbolKind.EnumMember;
        return SymbolKind.Operator;
        
    */
}