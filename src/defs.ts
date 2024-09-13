// This file provides a way to parse a single WebAssembly function and convert
// it to JavaScript. Functions are compiled lazily when they are first evaluated.

import { Type } from "./parse.ts";

export enum Op {
  // These are prefixed by 0xFC
  i32_trunc_sat_f32_s = 0x00,
  i32_trunc_sat_f32_u = 0x01,
  i32_trunc_sat_f64_s = 0x02,
  i32_trunc_sat_f64_u = 0x03,
  i64_trunc_sat_f32_s = 0x04,
  i64_trunc_sat_f32_u = 0x05,
  i64_trunc_sat_f64_s = 0x06,
  i64_trunc_sat_f64_u = 0x07,

  // These are prefixed by 0xFC
  memory_copy = 0x0A,
  memory_fill = 0x0B,

  unreachable = 0x00,
  nop = 0x01,
  block = 0x02,
  loop = 0x03,
  if = 0x04,
  else = 0x05,
  end = 0x0B,
  br = 0x0C,
  br_if = 0x0D,
  br_table = 0x0E,
  return = 0x0F,
  call = 0x10,
  call_indirect = 0x11,

  drop = 0x1A,
  select = 0x1B,
  select_type = 0x1C,

  local_get = 0x20,
  local_set = 0x21,
  local_tee = 0x22,
  global_get = 0x23,
  global_set = 0x24,

  table_get = 0x25,
  table_set = 0x26,

  i32_load = 0x28,
  i64_load = 0x29,
  f32_load = 0x2A,
  f64_load = 0x2B,
  i32_load8_s = 0x2C,
  i32_load8_u = 0x2D,
  i32_load16_s = 0x2E,
  i32_load16_u = 0x2F,
  i64_load8_s = 0x30,
  i64_load8_u = 0x31,
  i64_load16_s = 0x32,
  i64_load16_u = 0x33,
  i64_load32_s = 0x34,
  i64_load32_u = 0x35,
  i32_store = 0x36,
  i64_store = 0x37,
  f32_store = 0x38,
  f64_store = 0x39,
  i32_store8 = 0x3A,
  i32_store16 = 0x3B,
  i64_store8 = 0x3C,
  i64_store16 = 0x3D,
  i64_store32 = 0x3E,

  memory_size = 0x3F,
  memory_grow = 0x40,

  i32_const = 0x41,
  i64_const = 0x42,
  f32_const = 0x43,
  f64_const = 0x44,

  i32_eqz = 0x45,
  i32_eq = 0x46,
  i32_ne = 0x47,
  i32_lt_s = 0x48,
  i32_lt_u = 0x49,
  i32_gt_s = 0x4A,
  i32_gt_u = 0x4B,
  i32_le_s = 0x4C,
  i32_le_u = 0x4D,
  i32_ge_s = 0x4E,
  i32_ge_u = 0x4F,

  i64_eqz = 0x50,
  i64_eq = 0x51,
  i64_ne = 0x52,
  i64_lt_s = 0x53,
  i64_lt_u = 0x54,
  i64_gt_s = 0x55,
  i64_gt_u = 0x56,
  i64_le_s = 0x57,
  i64_le_u = 0x58,
  i64_ge_s = 0x59,
  i64_ge_u = 0x5A,

  f32_eq = 0x5B,
  f32_ne = 0x5C,
  f32_lt = 0x5D,
  f32_gt = 0x5E,
  f32_le = 0x5F,
  f32_ge = 0x60,

  f64_eq = 0x61,
  f64_ne = 0x62,
  f64_lt = 0x63,
  f64_gt = 0x64,
  f64_le = 0x65,
  f64_ge = 0x66,

  i32_clz = 0x67,
  i32_ctz = 0x68,
  i32_popcnt = 0x69,
  i32_add = 0x6A,
  i32_sub = 0x6B,
  i32_mul = 0x6C,
  i32_div_s = 0x6D,
  i32_div_u = 0x6E,
  i32_rem_s = 0x6F,
  i32_rem_u = 0x70,
  i32_and = 0x71,
  i32_or = 0x72,
  i32_xor = 0x73,
  i32_shl = 0x74,
  i32_shr_s = 0x75,
  i32_shr_u = 0x76,
  i32_rotl = 0x77,
  i32_rotr = 0x78,

  i64_clz = 0x79,
  i64_ctz = 0x7A,
  i64_popcnt = 0x7B,
  i64_add = 0x7C,
  i64_sub = 0x7D,
  i64_mul = 0x7E,
  i64_div_s = 0x7F,
  i64_div_u = 0x80,
  i64_rem_s = 0x81,
  i64_rem_u = 0x82,
  i64_and = 0x83,
  i64_or = 0x84,
  i64_xor = 0x85,
  i64_shl = 0x86,
  i64_shr_s = 0x87,
  i64_shr_u = 0x88,
  i64_rotl = 0x89,
  i64_rotr = 0x8A,

  f32_abs = 0x8B,
  f32_neg = 0x8C,
  f32_ceil = 0x8D,
  f32_floor = 0x8E,
  f32_trunc = 0x8F,
  f32_nearest = 0x90,
  f32_sqrt = 0x91,
  f32_add = 0x92,
  f32_sub = 0x93,
  f32_mul = 0x94,
  f32_div = 0x95,
  f32_min = 0x96,
  f32_max = 0x97,
  f32_copysign = 0x98,

  f64_abs = 0x99,
  f64_neg = 0x9A,
  f64_ceil = 0x9B,
  f64_floor = 0x9C,
  f64_trunc = 0x9D,
  f64_nearest = 0x9E,
  f64_sqrt = 0x9F,
  f64_add = 0xA0,
  f64_sub = 0xA1,
  f64_mul = 0xA2,
  f64_div = 0xA3,
  f64_min = 0xA4,
  f64_max = 0xA5,
  f64_copysign = 0xA6,

  i32_wrap_i64 = 0xA7,
  i32_trunc_f32_s = 0xA8,
  i32_trunc_f32_u = 0xA9,
  i32_trunc_f64_s = 0xAA,
  i32_trunc_f64_u = 0xAB,
  i64_extend_i32_s = 0xAC,
  i64_extend_i32_u = 0xAD,
  i64_trunc_f32_s = 0xAE,
  i64_trunc_f32_u = 0xAF,
  i64_trunc_f64_s = 0xB0,
  i64_trunc_f64_u = 0xB1,
  f32_convert_i32_s = 0xB2,
  f32_convert_i32_u = 0xB3,
  f32_convert_i64_s = 0xB4,
  f32_convert_i64_u = 0xB5,
  f32_demote_f64 = 0xB6,
  f64_convert_i32_s = 0xB7,
  f64_convert_i32_u = 0xB8,
  f64_convert_i64_s = 0xB9,
  f64_convert_i64_u = 0xBA,
  f64_promote_f32 = 0xBB,
  i32_reinterpret_f32 = 0xBC,
  i64_reinterpret_f64 = 0xBD,
  f32_reinterpret_i32 = 0xBE,
  f64_reinterpret_i64 = 0xBF,

  i32_extend8_s = 0xC0,
  i32_extend16_s = 0xC1,
  i64_extend8_s = 0xC2,
  i64_extend16_s = 0xC3,
  i64_extend32_s = 0xC4,

  // These are our own opcodes, and are not part of WebAssembly
  BOOL = 0xF0,
  BOOL_NOT = 0xF1,
  BOOL_TO_INT = 0xF2,
  TO_U32 = 0xF3,
  TO_S64 = 0xF4,
  U32_LOAD = 0xF5,
  S64_LOAD = 0xF6,
}

export const enum BlockKind {
  Normal,
  Loop,
  IfElse,
}

export interface Block {
  argCount_: number
  isDead_: boolean
  kind_: BlockKind
  labelBreak_: number
  labelContinueOrElse_: number
  parentStackTop_: number
  returnCount_: number
}

export const liveCastToWASM = (value: any, type: Type): number | bigint => {
  if (type === Type.F32 || type === Type.F64) return +value
  if (type === Type.I32) return value | 0
  if (type === Type.I64) return BigInt(value) & 0xFFFF_FFFF_FFFF_FFFFn
  throw new Error('Unsupported cast to type ' + type)
}

export const castToWASM = (code: string, type: Type): string => {
  if (type === Type.F32 || type === Type.F64) return '+' + code
  if (type === Type.I32) return code + '|0'
  if (type === Type.I64) return `BigInt(${code})&0xFFFFFFFFFFFFFFFFn`
  throw new Error('Unsupported cast to type ' + type)
}

export const castToJS = (code: string, type: Type): string => {
  if (type === Type.F64 || type === Type.I32) return code
  if (type === Type.F32) return `Math.fround(${code})`
  if (type === Type.I64) return `l.${/* @__KEY__ */ 'u64_to_s64_'}(${code})`
  throw new Error('Unsupported cast to type ' + type)
}

export const enum MetaFlag {
  PopMask = 3, // Bits 0 and 1 are for the number of values popped from the stack
  Push = 1 << 2, // Pushes one value to the stack (e.g. "local_get")
  Simple = 1 << 3, // Doesn't need special handling during the initial scan (e.g. not "call")
  HasIndex = 1 << 4, // Has an index payload (e.g. "global_get")
  HasAlign = 1 << 5, // Has an align byte (e.g. "i32_store8")
  BoolToInt = 1 << 6, // Results in a boolean that must be casted back to an i32
  ToU32 = 1 << 7, // Arguments should be converted to 32-bit unsigned
  ToS64 = 1 << 8, // Arguments should be converted to 64-bit signed
  Omit = 1 << 9, // This causes us to omit the instruction entirely (e.g. "f64_promote_f32")
  And63 = 1 << 10, // The second operand needs a bitwise-and with 63
}

// This lookup table helps decode WebAssembly bytecode compactly. Most bytecodes
// have a regular stack-based structure. This is translated into a register-based
// structure internally, where a "register" is a JavaScript local variable.
export const metaTable = new Uint16Array(256)

metaTable[Op.nop] = MetaFlag.Omit | MetaFlag.Simple
metaTable[Op.drop] = 1 | MetaFlag.Omit | MetaFlag.Simple

metaTable[Op.local_get] = MetaFlag.Push | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.local_set] = 1 | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.local_tee] = 1 | MetaFlag.Push | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.global_get] = MetaFlag.Push | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.global_set] = 1 | MetaFlag.HasIndex | MetaFlag.Simple

metaTable[Op.i32_load] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_load] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.f32_load] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.f64_load] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i32_load8_s] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i32_load8_u] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i32_load16_s] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i32_load16_u] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_load8_s] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_load8_u] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_load16_s] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_load16_u] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_load32_s] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_load32_u] = 1 | MetaFlag.Push | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i32_store] = 2 | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_store] = 2 | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.f32_store] = 2 | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.f64_store] = 2 | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i32_store8] = 2 | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i32_store16] = 2 | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_store8] = 2 | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_store16] = 2 | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.i64_store32] = 2 | MetaFlag.HasAlign | MetaFlag.HasIndex | MetaFlag.Simple

metaTable[Op.memory_size] = MetaFlag.Push | MetaFlag.HasIndex | MetaFlag.Simple
metaTable[Op.memory_grow] = 1 | MetaFlag.Push | MetaFlag.HasIndex | MetaFlag.Simple

metaTable[Op.i32_eqz] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_eq] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i32_ne] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i32_lt_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i32_lt_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt | MetaFlag.ToU32
metaTable[Op.i32_gt_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i32_gt_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt | MetaFlag.ToU32
metaTable[Op.i32_le_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i32_le_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt | MetaFlag.ToU32
metaTable[Op.i32_ge_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i32_ge_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt | MetaFlag.ToU32

metaTable[Op.i64_eqz] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_eq] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i64_ne] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i64_lt_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt | MetaFlag.ToS64
metaTable[Op.i64_lt_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i64_gt_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt | MetaFlag.ToS64
metaTable[Op.i64_gt_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i64_le_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt | MetaFlag.ToS64
metaTable[Op.i64_le_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.i64_ge_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt | MetaFlag.ToS64
metaTable[Op.i64_ge_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt

metaTable[Op.f32_eq] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f32_ne] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f32_lt] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f32_gt] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f32_le] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f32_ge] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt

metaTable[Op.f64_eq] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f64_ne] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f64_lt] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f64_gt] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f64_le] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt
metaTable[Op.f64_ge] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.BoolToInt

metaTable[Op.i32_clz] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_ctz] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_popcnt] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_add] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_sub] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_mul] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_div_s] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_div_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.ToU32
metaTable[Op.i32_rem_s] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_rem_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.ToU32
metaTable[Op.i32_and] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_or] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_xor] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_shl] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_shr_s] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_shr_u] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_rotl] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_rotr] = 2 | MetaFlag.Push | MetaFlag.Simple

metaTable[Op.i64_clz] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_ctz] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_popcnt] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_add] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_sub] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_mul] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_div_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.ToS64
metaTable[Op.i64_div_u] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_rem_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.ToS64
metaTable[Op.i64_rem_u] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_and] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_or] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_xor] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_shl] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.And63
metaTable[Op.i64_shr_s] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.And63
metaTable[Op.i64_shr_u] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.And63
metaTable[Op.i64_rotl] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.And63
metaTable[Op.i64_rotr] = 2 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.And63

metaTable[Op.f32_abs] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_neg] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_ceil] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_floor] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_trunc] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_nearest] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_sqrt] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_add] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_sub] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_mul] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_div] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_min] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_max] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_copysign] = 2 | MetaFlag.Push | MetaFlag.Simple

metaTable[Op.f64_abs] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_neg] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_ceil] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_floor] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_trunc] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_nearest] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_sqrt] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_add] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_sub] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_mul] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_div] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_min] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_max] = 2 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_copysign] = 2 | MetaFlag.Push | MetaFlag.Simple

metaTable[Op.i32_wrap_i64] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_trunc_f32_s] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_trunc_f32_u] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_trunc_f64_s] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_trunc_f64_u] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_extend_i32_s] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_extend_i32_u] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_trunc_f32_s] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_trunc_f32_u] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_trunc_f64_s] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_trunc_f64_u] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_convert_i32_s] = 1 | MetaFlag.Push | MetaFlag.Omit | MetaFlag.Simple
metaTable[Op.f32_convert_i32_u] = 1 | MetaFlag.Push | MetaFlag.Omit | MetaFlag.Simple | MetaFlag.ToU32
metaTable[Op.f32_convert_i64_s] = 1 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.ToS64
metaTable[Op.f32_convert_i64_u] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_demote_f64] = 1 | MetaFlag.Push | MetaFlag.Omit | MetaFlag.Simple
metaTable[Op.f64_convert_i32_s] = 1 | MetaFlag.Push | MetaFlag.Omit | MetaFlag.Simple
metaTable[Op.f64_convert_i32_u] = 1 | MetaFlag.Push | MetaFlag.Omit | MetaFlag.Simple | MetaFlag.ToU32
metaTable[Op.f64_convert_i64_s] = 1 | MetaFlag.Push | MetaFlag.Simple | MetaFlag.ToS64
metaTable[Op.f64_convert_i64_u] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_promote_f32] = 1 | MetaFlag.Push | MetaFlag.Omit | MetaFlag.Simple
metaTable[Op.i32_reinterpret_f32] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_reinterpret_f64] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f32_reinterpret_i32] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.f64_reinterpret_i64] = 1 | MetaFlag.Push | MetaFlag.Simple

metaTable[Op.i32_extend8_s] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i32_extend16_s] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_extend8_s] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_extend16_s] = 1 | MetaFlag.Push | MetaFlag.Simple
metaTable[Op.i64_extend32_s] = 1 | MetaFlag.Push | MetaFlag.Simple

// WebAssembly bytecode is decoded into an AST so that it can be optimized
// before converting it to JavaScript. The AST is stored as numbers in an
// array instead of as JavaScript objects for performance, which can matter
// a lot when the JavaScript JIT is disabled.
//
// Each AST node takes the following form:
//
//   ast[ptr] = opcode | (childCount << Pack.ChildCountShift) | (outputStackSlot << Pack.OutSlotShift)
//   ast[ptr + 1] = /* child 1 */
//   ast[ptr + 2] = /* child 2 */
//   ...
//   ast[ptr + N] = /* child N */
//   ast[ptr + N + 1] = /* an optional extra payload (e.g. an offset for load/store) */
//
// Encoding the child count in the node metadata and putting optional extra
// data after the children allows the AST to be traversed generically without
// needing to know the specifics of each node's internal format.
export const enum Pack {
  OpMask = 255,
  ChildCountShift = 8,
  ChildCountMask = 0xFFFF,
  OutSlotShift = 24,
}
