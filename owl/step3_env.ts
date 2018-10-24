import { Env } from './env';
import { readline } from './node_readline';
import { prStr } from './printer';
import { BlankException, readStr } from './reader';
import {
  OwlFunction,
  OwlHashMap,
  OwlList,
  OwlNumber,
  OwlSymbol,
  OwlType,
  OwlVector,
  Types,
} from './types';

// READ
const READ = (str: string): OwlType => {
  return readStr(str);
};

// EVAL
const EVAL = (ast: OwlType, env: Env): OwlType => {
  if (!ast) throw new Error('invalid syntax');
  if (ast.type !== Types.List) {
    return evalAST(ast, env);
  }
  if (ast.list.length === 0) {
    return ast;
  }

  const first = ast.list[0];

  switch (first.type) {
    case Types.Symbol:
      switch (Symbol.keyFor(first.val)) {
        case 'def!': {
          const [, key, value] = ast.list;
          if (key.type !== Types.Symbol) {
            throw new Error(
              `unexpected toke type: ${key.type}, expected: symbol`,
            );
          }
          if (!value) {
            throw new Error(`unexpected syntax`);
          }
          return env.set(key, EVAL(value, env));
        }
        case 'let*': {
          const letEnv = new Env(env);
          const pairs = ast.list[1];
          if (pairs.type !== Types.List && pairs.type !== Types.Vector) {
            throw new Error(
              `unexpected toke type: ${pairs.type}, expected: list or vector`,
            );
          }
          const list = pairs.list;

          for (let i = 0; i < list.length; i += 2) {
            const key = list[i];
            const value = list[i + 1];

            if (!key || !value) {
              throw new Error(`syntax error`);
            }
            if (key.type !== Types.Symbol) {
              throw new Error(
                `unexpected token type: ${key.type}, expected: symbol`,
              );
            }
            letEnv.set(key, EVAL(value, letEnv));
          }

          return EVAL(ast.list[2], letEnv);
        }
      }
  }
  const res = evalAST(ast, env) as OwlList;
  const [fn, ...args] = res.list;
  if (fn.type !== Types.Function) {
    throw new Error(`unexpected token: ${fn.type}, expected: function`);
  }
  return fn.func(...args);
};
/**
 * function eval_ast which takes ast (owl data type) and an associative structure (the environment from above).
 * eval_ast switches on the type of ast as follows:
 * symbol:   lookup the symbol in the environment structure and return the value or raise an error if no value is found
 * list:     return a new list that is the result of calling EVAL on each of the members of the list
 * otherwise just return the original ast value
 *
 * @param ast owl data type
 * @param env the associative structure
 */
const evalAST = (ast: OwlType, env: Env): OwlType => {
  switch (ast.type) {
    case Types.Symbol:
      const find = env.get(ast);
      if (!find) {
        throw new Error(`unknown symbol: ${Symbol.keyFor(ast.val)}`);
      }
      return find;
    case Types.List:
      return new OwlList(ast.list.map(el => EVAL(el, env)));
    case Types.Vector:
      return new OwlVector(ast.list.map(el => EVAL(el, env)));
    case Types.HashMap:
      const list: OwlType[] = [];
      for (const [key, value] of ast.map.entries()) {
        list.push(key);
        list.push(EVAL(value, env));
      }
      return new OwlHashMap(list);

    default:
      return ast;
  }
};

// PRINT
const PRINT = prStr;
// noinspection TsLint
const replEnv = new Env();
replEnv.set(
  new OwlSymbol('+'),
  new OwlFunction(
    (a?: OwlNumber, b?: OwlNumber) => new OwlNumber(a!.val + b!.val),
  ),
);
replEnv.set(
  new OwlSymbol('-'),
  new OwlFunction(
    (a?: OwlNumber, b?: OwlNumber) => new OwlNumber(a!.val - b!.val),
  ),
);
replEnv.set(
  new OwlSymbol('*'),
  new OwlFunction(
    (a?: OwlNumber, b?: OwlNumber) => new OwlNumber(a!.val * b!.val),
  ),
);
replEnv.set(
  new OwlSymbol('/'),
  new OwlFunction(
    (a?: OwlNumber, b?: OwlNumber) => new OwlNumber(a!.val / b!.val),
  ),
);

const rep = (str: string): string => PRINT(EVAL(READ(str), replEnv));

while (true) {
  const line = readline('user> ');
  if (line == null || line === '(exit)') {
    break;
  }
  if (line === '') {
    continue;
  }
  try {
    console.log(rep(line));
  } catch (exc) {
    if (exc instanceof BlankException) {
      continue;
    }
    if (exc.stack) {
      console.log(exc.stack);
    } else {
      console.log(`Error: ${exc}`);
    }
  }
}
