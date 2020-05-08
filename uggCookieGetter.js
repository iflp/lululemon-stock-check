const parser = require('shift-parser');
const fetch = require('node-fetch');
const atob = require('atob');
const getUggCookie = async () => {
  const headers = {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
  };

  const site = await fetch('https://au.ugg.com', {
    headers,
  });

  const text = await site.text();
  const token = text.substring(text.lastIndexOf('token=') + 6, text.lastIndexOf('"></script>'));

  const KP_UIDzCookie = site.headers.get('set-cookie').split(' ')[0];
  //   console.dir(token, { depth: 10, colors: true });
  //   console.log(KP_UIDzCookie);

  const fpPayload = await fetch(
    `https://au.ugg.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint/script/kpf.js?url=/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fingerprint&token=${token}`,
    { headers: { ...headers } }
  ).then((e) => e.text());

  const script = parser.parseScript(fpPayload);
  const keywordArr = script.statements[4].declaration.declarators[0].init.elements.map(
    (e) => e.value
  );

  //Array is offset by a dynamically generated value;
  const keywordArrayOffset = script.statements[5].expression.arguments[1].value + 1; //+1 is a magic number by the minifier

  const goodKeywordArr = correctlyOffsetKeywordArr(keywordArr, keywordArrayOffset);

  //need to get the 15 hashes array.
  const arr = script.statements[8].expression.operand.callee.body.statements[12];
  const hashesArr = getProperBranch(arr).map((e) => {
    if (typeof e !== 'string') {
      return testCase(goodKeywordArr[e[0]], e[1]);
    } else {
      return e;
    }
  });

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

  return fp.headers.get('set-cookie').split(' ')[0];
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

const getProperBranch = (node) => {
  //The nodes sometimes are different because of the minification - brute force here to get the correct one
  let _properArr = [];
  if (node.body.statements[0].type === 'IfStatement') {
    const _ifBlock = node.body.statements[0];

    if (_ifBlock.consequent.block.statements.length >= 10) {
      _properArr = _ifBlock.consequent.block.statements;
    } else if (_ifBlock.alternate.block.statements.length >= 10) {
      _properArr = _ifBlock.alternate.block.statements;
    } else {
      console.dir(_ifBlock, { depth: 3, colors: true });
    }
  } else {
    _properArr = node.body.statements;
  }

  return _properArr
    .filter((e) => e.type === 'ExpressionStatement')
    .map((e) => e.expression)
    .filter((e) => e.type === 'AssignmentExpression')
    .map((e) => e.binding.expression)
    .map((e) => {
      if (e.type === 'LiteralStringExpression') {
        return e.value;
      } else if (e.type === 'CallExpression') {
        return [e.arguments[0].value - 0, e.arguments[1].value];
      }
    });
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

module.exports = {
  getUggCookie,
};
