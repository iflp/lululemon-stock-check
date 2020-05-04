const http = require('http');
const fetch = require('node-fetch');
const pMap = require('p-map');

const hostname = '127.0.0.1';
const port = 8001;

const server = http.createServer(async (req, res) => {
  if (req.url === '/favicon.ico') {
    //get rid of annoying favicon call from browsers
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end();
    return;
  }

  const categoriesToScrape = ['all-womens-bottoms', 'all-womens-tops', 'accessories'];

  const productInfoUrl = (pid) =>
    `https://www.lululemon.com.au/on/demandware.store/Sites-AU-Site/en_AU/Product-Variation?pid=${pid}`;

  const categoryUrl = (category, count = 1000) =>
    `https://www.lululemon.com.au/on/demandware.store/Sites-AU-Site/en_AU/Search-UpdateGrid?cgid=${category}&start=0&sz=${count}`;

  const categoryUrlArray = categoriesToScrape.map(categoryUrl);

  const pidArrMapper = async (url) => {
    const r = await fetch(url).then((e) => e.text());
    const pidArr = r
      .match(/data-pid="(.*?)">/gi)
      .map((e) => e.split('"')[1])
      .flat();

    return pidArr;
  };

  const pidArray = (await pMap(categoryUrlArray, pidArrMapper, { concurrency: 100 })).flat();
  const productInfoUrlArray = pidArray.map(productInfoUrl);

  const pInfoMapper = async (site) => {
    const productInfoResponse = await fetch(site).then((e) => e.json());
    return productInfoResponse;
  };

  const productInfoResponseArr = await pMap(productInfoUrlArray, pInfoMapper, { concurrency: 100 });
  const HTMLRows = await pMap(productInfoResponseArr, HTMLRowMapper, { concurrency: 100 });
  const result = makeHTMLHead + HTMLRows.join('') + '</table>';
  res.end(result);
});

const makeHTMLHead =
  '<style>table, th, td {border: 1px solid black;} td { padding: 5px;}</style><table style="width:100%"><tr><th style="text-align:left;">Item</th><th  style="text-align:left;">price1</th><th  style="text-align:left;">price2</th><th  style="text-align:left;">Stock</th></tr>';

const HTMLRowMapper = async (productJson) => {
  const pageLink = `https://www.lululemon.com.au/en-au/p/${productJson.digitalProductData.productName}/${productJson.digitalProductData.productID}.html`;

  const listItemArray = await pMap(productJson.product.variationAttributes[0].values, colorMapper, {
    concurrency: 5,
  });

  return `<tr><td><a href="${pageLink}" target="_blank">${
    productJson.product.productName
  }</a></td><td>${
    productJson.product.price.sales ? productJson.product.price.sales.formatted : '-'
  }</td><td>${productJson.product.price.list ? productJson.product.price.list.formatted : '-'}</td>
  <td><ul>
  ${listItemArray.join('')}
  </ul></td></tr>`;
};

const colorMapper = async (productColorValues) => {
  if (!productColorValues.selectable) return '';

  const stockResponse = await fetch(productColorValues.url).then((e) => e.json());
  const stockArray = stockResponse.product.variationAttributes[1].values.map(mapSizesReturnString);

  return `<li><img src="${
    productColorValues.images.swatch[0].url
  }" style="border: 1px solid black; width: 32px; height: 32px" /> ${
    productColorValues.displayValue
  } - ${stockArray.join(',')} </li>`;
};

const mapSizesReturnString = (sizeValue) => {
  if (sizeValue.selectable) {
    return sizeValue.displayValue;
  }
};

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
