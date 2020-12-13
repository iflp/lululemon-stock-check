const pMap = require('p-map');
const fetch = require('node-fetch');
const { scrapeProducts } = require('./scraper');

const lllmController = async (req, res) => {
  const lululemon = {
    rootUrl: 'https://www.lululemon.com.au',
    productInfoUrl: '/on/demandware.store/Sites-AU-Site/en_AU/Product-Variation',
    categoryUrl: '/on/demandware.store/Sites-AU-Site/en_AU/Search-UpdateGrid',
    categories: ['all-womens-bottoms', 'all-womens-tops', 'accessories'],
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
    },
  };

  const a = await scrapeProducts(lululemon);
  const HTMLRows = await pMap(a, HTMLRowMapper(lululemon.headers, lululemon.rootUrl), {
    concurrency: 100,
  });

  res.end(wrapTableAroundRows(HTMLRows));
};

const HTMLRowMapper = (headers, rootUrl) => async (productJson) => {
  if (productJson.error) {
    return `<tr><td>Error</td><td>Error</td><td>Error</td>
      <td>Error</td></tr>`;
  }
  const pageLink = `${rootUrl}${productJson.product.selectedProductUrl}`;
  try {
    const listItemArray = await pMap(
      productJson.product.variationAttributes[0].values,
      colorMapper(headers, rootUrl),
      {
        concurrency: 5,
      }
    );
  
    return `<tr><td><a href="${pageLink}" target="_blank">${
      productJson.product.productName
    }</a></td><td>${
      productJson.product.price.sales ? productJson.product.price.sales.formatted : '-'
    }</td><td>${productJson.product.price.list ? productJson.product.price.list.formatted : '-'}</td>
      <td><ul>
      ${listItemArray.join('')}
      </ul></td></tr>`;
  } catch (e) {
    return `<tr><td>${productJson.product.productName}</a></td><td>Error</td><td>Error</td>
      <td><ul>
      Error
      </ul></td></tr>`
    
  }

};

const colorMapper = (headers, rootUrl) => async (productColorValues) => {
  if (!productColorValues.selectable) return '';

  // const stockResponse = await fetch(productColorValues.url, { headers }).then((e) => e.json());
  const rawResponse = await fetch(productColorValues.url, { headers });

  try {
    const stockResponse =  await rawResponse.json();
    const stockArray = stockResponse.product.variationAttributes[1].values.map(mapSizesReturnString);
    return `<li><img src="${
      productColorValues.images.swatch[0].url
    }" style="border: 1px solid black; width: 32px; height: 32px" /> ${
      productColorValues.displayValue
    } - ${stockArray.join(',')} </li>`;
  } catch (e) {
  return `<li><img src="" style="border: 1px solid black; width: 32px; height: 32px" /> Error </li>`;
  }
};

const mapSizesReturnString = (sizeValue) => {
  if (sizeValue.selectable) {
    return sizeValue.displayValue;
  }
};

module.exports = {
  lllmController,
};

const wrapTableAroundRows = (rowArr) =>
  `<style>table, th, td {border: 1px solid black;} td { padding: 5px;}</style><table style="width:100%"><tr><th style="text-align:left;">Item</th><th  style="text-align:left;">price1</th><th  style="text-align:left;">price2</th><th  style="text-align:left;">Stock</th></tr>${rowArr.join(
    ''
  )}</table>`;
