import { Global, Instance, Memory, Table } from "./instantiate.ts";
import { Module } from "./parse.ts";

export { Global, Instance, Memory, Table } from "./instantiate.ts";
export { Module } from "./parse.ts";

export const CompileError = WebAssembly.CompileError;
export const LinkError = WebAssembly.LinkError;

export type GlobalDescriptor = WebAssembly.GlobalDescriptor;
export type MemoryDescriptor = WebAssembly.MemoryDescriptor;
export type ModuleExportDescriptor = WebAssembly.ModuleExportDescriptor;
export type ModuleImportDescriptor = WebAssembly.ModuleImportDescriptor;
export type TableDescriptor = WebAssembly.TableDescriptor;
export type WebAssemblyInstantiatedSource = { module: Module, instance: Instance };
export type ImportExportKind = WebAssembly.ImportExportKind;
export type TableKind = WebAssembly.TableKind;
export type ExportValue = Function | Global | Memory | Table;
export type Exports = Record<string, ExportValue>;
export type ImportValue = ExportValue | number;
export type Imports = Record<string, ModuleImports>;
export type ModuleImports = Record<string, ImportValue>;
export type ValueType = WebAssembly.ValueType;

/** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/compile_static) */
export function compile(bytes: BufferSource): Promise<Module> {
    return Promise.resolve(new Module(bytes));
}

/** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/compileStreaming_static) */
export async function compileStreaming(source: Response | PromiseLike<Response>): Promise<Module> {
    const bytes = await source;
    return compile(await bytes.arrayBuffer());
}

/** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/instantiate_static) */
export async function instantiate(bytes: BufferSource, importObject?: Imports): Promise<WebAssemblyInstantiatedSource>;
export async function instantiate(moduleObject: Module, importObject?: Imports): Promise<Instance>;
export function instantiate(input: BufferSource | Module, importObject?: Imports): Promise<WebAssemblyInstantiatedSource | Instance> {
    if (input instanceof Module) return Promise.resolve(new Instance(input, importObject));
    const module = new Module(input);
    return Promise.resolve({
        module,
        instance: new Instance(input, importObject),
    });
}

/** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/instantiateStreaming_static) */
export async function instantiateStreaming(source: Response | PromiseLike<Response>, importObject?: Imports): Promise<WebAssemblyInstantiatedSource> {
    const bytes = await source;
    return instantiate(await bytes.arrayBuffer(), importObject);
}

/** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/validate_static) */
export function validate(bytes: BufferSource): boolean {
    try {
        new Module(bytes);
        return true;
    } catch {
        return false;
    }
}
