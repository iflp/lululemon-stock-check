const parser = require('shift-parser');
const fetch = require('node-fetch');
const atob = require('atob');
const _getUggCookie = async () => {
  const headers = {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  };

  const site = await fetch(
    'https://au.ugg.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fp',
    {
      headers,
    }
  );

  const text = await site.text();
  const token = text.substring(text.lastIndexOf('token=') + 6, text.lastIndexOf('"></script>'));

  const KP_UIDzCookie = site.headers.get('set-cookie').split(' ')[0];

  const fpPayload = await fetch(
    `https://au.ugg.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint/script/kpf.js?url=/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint&token=${token}`,
    { headers: { ...headers } }
  ).then((e) => e.text());

  const script = parser.parseScript(fpPayload);
  let index = null;
  const keywordArrs = script.statements.filter((e, i) => {
    const isKeywordArr =
      e.type === 'VariableDeclarationStatement' &&
      e.declaration.declarators[0].init.type === 'ArrayExpression';
    if (isKeywordArr) {
      index = i;
    }

    return isKeywordArr;
  });
  const keywordArr = keywordArrs[0].declaration.declarators[0].init.elements.map((e) => e.value);

  //Array is offset by a dynamically generated value;
  const keywordArrayOffset = script.statements[index + 1].expression.arguments[1].value + 1; //+1 is a magic number by the minifier

  const goodKeywordArr = correctlyOffsetKeywordArr(keywordArr, keywordArrayOffset);
  console.log(goodKeywordArr);
  const a =
    script.statements[script.statements.length - 1].expression.operand.callee.body.statements;

  //we want to look for a function declaration with 11 parameters, that's the function we're after
  const fnWithHashes = a.filter((e) => e.params && e.params.items.length === 11)[0];
  const nodeArr = fnWithHashes.body.statements;
  if (!nodeArr) throw new Error("Can't find hashes array");

  function parseNode(node) {
    switch (node.type) {
      case 'ExpressionStatement':
        if (node.expression.type !== 'AssignmentExpression') return null;

        if (node.expression.binding.expression.type === 'LiteralStringExpression') {
          return node.expression.binding.expression.value;
        } else if (node.expression.binding.expression.type === 'CallExpression') {
          const ex = node.expression.binding.expression;
          return testCase(goodKeywordArr[ex.arguments[0].value - 0], ex.arguments[1].value);
        }
        break;
      case 'IfStatement':
        if (node.alternate && node.alternate.block.statements.length > 11) {
          return node.alternate.block.statements.map(parseNode).filter((e) => e !== null);
        } else if (node.consequent.block) {
          return node.consequent.block.statements.map(parseNode).filter((e) => e !== null);
        }
      case 'VariableDeclarationStatement':
      default:
        return null;
    }
  }
  const hashesArr = nodeArr
    .map(parseNode)
    .filter((e) => e !== null)
    .flat();

  const payload = {
    t: token,
    d: {
      [hashesArr[0]]: '70da17cde36b36ae1aa3e521e0886be5',
      [hashesArr[1]]:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
      [hashesArr[2]]: false,
      [hashesArr[3]]: false,
      [hashesArr[4]]: false,
      [hashesArr[5]]: true,
      [hashesArr[6]]: [1920, 1050],
      [hashesArr[7]]: [],
      [hashesArr[8]]: [],
      [hashesArr[9]]:
        'TypeError: [] is not a function\n    at _0xd2bfe5 (https://au.ugg.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint/script/kpf.js?url=/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint&token=f737e0fd-7a98-65f2-71d1-a8ed6fa1f367:9:15640)\n    at _0x5e55c8 (https://au.ugg.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint/script/kpf.js?url=/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint&token=f737e0fd-7a98-65f2-71d1-a8ed6fa1f367:9:21387)\n    at https://au.ugg.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint/script/kpf.js?url=/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint&token=f737e0fd-7a98-65f2-71d1-a8ed6fa1f367:9:23648\n    at https://au.ugg.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/f.js:1:1802\n    at https://au.ugg.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/f.js:1:14149',
      [hashesArr[10]]: false,
      [hashesArr[11]]: false,
      [hashesArr[12]]: false,
      [hashesArr[13]]: false,
      [hashesArr[14]]: false,
    },
  };

  const fp = await fetch(
    'https://au.ugg.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint',
    {
      method: 'POST',
      headers: {
        ...headers,
        cookie: KP_UIDzCookie,
        'content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(payload),
    }
  );

  const cookie = fp.headers
    .get('set-cookie')
    .split(' ')
    .find((e) => e.includes('sdf='));

  if (!cookie) {
    console.log(fpPayload);
  }

  return cookie;
};

//
//offset function
const correctlyOffsetKeywordArr = (keywordArr, offset) => {
  const _keywordArr = [...keywordArr];
  for (; --offset; ) {
    _keywordArr['push'](_keywordArr['shift']());
  }

  return _keywordArr;
};

//deobfuscation function copied from source
const testCase = function (data, fn) {
  var secretKey = [];
  var y = 0;
  var temp;
  var testResult = '';
  var tempData = '';
  data = atob(data);
  var val = 0;
  var key = data['length'];
  for (; val < key; val++) {
    tempData = tempData + ('%' + ('00' + data['charCodeAt'](val)['toString'](16))['slice'](-2));
  }

  data = decodeURIComponent(tempData);
  var x = 0;
  for (; x < 256; x++) {
    secretKey[x] = x;
  }
  x = 0;
  for (; x < 256; x++) {
    y = (y + secretKey[x] + fn['charCodeAt'](x % fn['length'])) % 256;
    temp = secretKey[x];
    secretKey[x] = secretKey[y];
    secretKey[y] = temp;
  }
  x = 0;
  y = 0;
  var i = 0;

  for (; i < data['length']; i++) {
    x = (x + 1) % 256;
    y = (y + secretKey[x]) % 256;
    temp = secretKey[x];
    secretKey[x] = secretKey[y];
    secretKey[y] = temp;
    testResult =
      testResult +
      String['fromCharCode'](
        data['charCodeAt'](i) ^ secretKey[(secretKey[x] + secretKey[y]) % 256]
      );
  }

  return testResult;
};

const getUggCookie = async () => {
  let cookie = await _getUggCookie();

  if (!cookie) {
    console.log('retry 1');
    cookie = await _getUggCookie();
  }

  if (!cookie) {
    console.log('retry 2');
    cookie = await _getUggCookie();
  }

  if (!cookie) {
    console.log('retry 3');
    cookie = await _getUggCookie();
  }

  if (!cookie) {
    console.log('retry 4');
    cookie = await _getUggCookie();
  }

  if (!cookie) {
    console.log('retry 5');
    cookie = await _getUggCookie();
  }

  return cookie;
};

module.exports = {
  getUggCookie,
};
