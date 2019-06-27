import {
    DocumentSymbolProvider,
    SymbolInformation,
    CancellationToken,
    TextDocument,
    Location,
    SymbolKind,
    Range,
    TreeDataProvider,
    TreeItem,
    Event,
    EventEmitter,
    TreeItemCollapsibleState,
    window
} from 'vscode'
import { FastMap } from 'collections/fast-map';
import { List } from 'collections/list';

// See test/SymbolKind_icons.png for an overview of the icons
export function getSymbolKind(name: String): SymbolKind {
    switch (name) {
        case 'parameter':
        case 'localparam': return SymbolKind.Constant;
        case 'package':
        case 'import': return SymbolKind.Package;
        case 'wire':
        case 'reg':
        case 'logic': return SymbolKind.Boolean;
        case 'string': return SymbolKind.String;
        case 'class': return SymbolKind.Class;
        case 'task': return SymbolKind.Method;
        case 'function': return SymbolKind.Function;
        case 'interface': return SymbolKind.Interface;
        case 'event': return SymbolKind.Event;
        case 'struct': return SymbolKind.Struct;
        case 'program': return SymbolKind.Module;
        case 'module':
        default: return SymbolKind.Variable;
    }
    /* Unused/Free SymbolKind icons
        return SymbolKind.Number;
        return SymbolKind.Enum;
        return SymbolKind.EnumMember;
        return SymbolKind.Operator;
        return SymbolKind.TypeParameter;
        return SymbolKind.Property;
        return SymbolKind.Array; 
    */
}

export class SystemVerilogDocumentSymbolProvider implements DocumentSymbolProvider {
    // XXX: Does not match virtual interface instantiantion, eg virtual intf u_virtInterface;
    // XXX: Does not match input/output/inout ports, eg input logic din, ..
    private illegalTypes = /(?!return|begin|end|else|join|fork|for|if|virtual|static|automatic|generate)/
    // TODO: Match labels with SymbolKind.Enum
    public regex: RegExp = new RegExp([
        // Potential identifier
        , /(?<=^\s*(?:(?:virtual|static|automatic|rand|randc|pure virtual)\s+)?)/
        // Illegal Symbol types
        , this.illegalTypes
        // Symbol type
        , /([:\w]+)\s+/
        // (modifier? returnType [.*]?      | parameterlist)?
        , /(?:(?:\w*\s+)?\w+(?:\s*\[.*?\])?\s+|\s*#\s*\([\s\S]*?\)\s*)?/
        // Symbol name, ignore multiple defines FIXME
        , this.illegalTypes
        , /(\w+)(?:\s*,\s*\w+)*?/
        // Port-list | class suffix
        , /(?:\s*\([\s\S]*?\)|(?:\s+(?:extends|implements)\s+\w+)+)?/
        // End of definition
        , /\s*;/
    ].map(x => x.source).join(''), 'mg');


    /**  
        Matches the regex pattern with the document's text. If a match is found, it creates a `SymbolInformation` object.
        If `workspaceSymbols` is not `undefined`, than the object is added to a mapped list to the document's `fsPath`, 
        otherwise add the objects to an empty list and return it.
        
        @param document The document in which the command was invoked.
        @param token A cancellation token.
        @param regex the pattern to match symbols with
        @param workspaceSymbols maps the list to add the objects to
        @return A list of `SymbolInformation` objects or a thenable that resolves to such. The lack of a result can be
        signaled by returning `undefined`, `null`, or an empty list.
    */
    public provideDocumentSymbols(document: TextDocument, token?: CancellationToken, regex?: RegExp, workspaceSymbols?: FastMap<string, List<SymbolInformation>>): Thenable<List<SymbolInformation>> {
        return new Promise((resolve) => {
            let uri = document.uri;
            var symbols;

            if (workspaceSymbols) {
                workspaceSymbols.set(uri.fsPath, new List<SymbolInformation>());
                //pass the reference of the symbols list to add the objects to
                symbols = workspaceSymbols.get(uri.fsPath);
            }
            else {
                symbols = new List<SymbolInformation>();
            }

            var match;
            let text = document.getText();

            if (regex == undefined) {
                regex = this.regex;
            }
            /* 
                Matches the regex and uses the index from the regex to find the position
            */
            do {
                match = regex.exec(text);
                if (match) {
                    let symbolInfo = new SymbolInformation(
                        match[2],
                        getSymbolKind(match[1]),
                        match[1],
                        new Location(document.uri,
                            new Range(document.positionAt(match.index),
                                document.positionAt(match.index + match[0].length)
                            )))
                    symbols.push(symbolInfo);
                }
            } while (match != null);

            resolve(symbols);
        });
    }
}

export class SystemVerilogDocumentSymbolTreeProvider implements TreeDataProvider<TreeItem> {
    // TODO: Not updating when active file changes
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private provider: SystemVerilogDocumentSymbolProvider = new SystemVerilogDocumentSymbolProvider();

    public getTreeItem(element: TreeItem): Promise<TreeItem> {
        return new Promise((resolve, reject) => {
            resolve(element);
        });
    }

    public getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        return new Promise((resolve, reject) => {
            let items = [];
            if (!element) {
                this.provider.provideDocumentSymbols(window.activeTextEditor.document).then(symbols => {
                    symbols.forEach(symbol => {
                        if (symbol.containerName == "") {
                            let item = new TreeItem(symbol.name)
                            item.resourceUri = window.activeTextEditor.document.uri;
                            if (symbols.map(a => a.containerName).indexOf(symbol.name) != 0) {
                                item.collapsibleState = TreeItemCollapsibleState.Collapsed
                            }
                            items.push(item);
                        }
                    });
                })
            } else {
                this.provider.provideDocumentSymbols(window.activeTextEditor.document).then(symbols => {
                    symbols.forEach(symbol => {
                        if (element.label == symbol.containerName) {
                            let item = new TreeItem(symbol.name)
                            item.resourceUri = window.activeTextEditor.document.uri;
                            item.id = symbol.location.uri.toString();
                            item.id += ",line:" + symbol.location.range.start.line.toString();
                            item.id += ",char:" + symbol.location.range.start.line.toString();
                            if (symbols.map(a => a.containerName).indexOf(symbol.name) != -1) {
                                item.collapsibleState = TreeItemCollapsibleState.Collapsed
                            }
                            items.push(item);
                        }
                    });
                });
            }
            resolve(items)
        });
    }
}
