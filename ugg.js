const pMap = require('p-map');
const { categoryUrl, pidArrMapper, productInfoUrl, pInfoMapper } = require('./scraper');
const { getUggCookie } = require('./uggCookieGetter');
const CONCURRENT_REQUEST_LIMIT = 100;

function chunkArrayInGroups(arr, size) {
  var myArray = [];
  for (var i = 0; i < arr.length; i += size) {
    myArray.push(arr.slice(i, i + size));
  }

  return myArray;
}

const uggController = async (req, res) => {
  //Each NM()sdf cookie is good for about 200 requests, farm 10 cookies and chuck it into an array.

  const ugg = {
    rootUrl: 'https://au.ugg.com',
    productInfoUrl: '/on/demandware.store/Sites-au-ugg-Site/en_AU/Product-Variation',
    categoryUrl: '/on/demandware.store/Sites-au-ugg-Site/en_AU/Search-UpdateGrid',
    categories: ['women-shop_all', 'kids-shop_all'],
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
      cookie: await getUggCookie(),
    },
  };

  //   let cookiePromiseArray = new Array(10).fill(null).map((e) => getUggCookie());
  //   const cookieArray = await Promise.all(cookiePromiseArray);

  const categoriesToScrape = ugg.categories;
  const makeCategoryUrl = categoryUrl(ugg.rootUrl, ugg.categoryUrl);
  const categoryUrlArr = categoriesToScrape.map(makeCategoryUrl);

  const pidArr = (
    await pMap(categoryUrlArr, pidArrMapper(ugg.headers), {
      concurrency: CONCURRENT_REQUEST_LIMIT,
    })
  ).flat();

  const makeProductInfoUrl = productInfoUrl(ugg.rootUrl, ugg.productInfoUrl);
  const pInfoUrlArr = pidArr.map(makeProductInfoUrl);
  //split big array into chunks and use a new cookie, to query
  const pInfoUrlArrArr = chunkArrayInGroups(pInfoUrlArr, 50);

  const pInfoArr = [];
  for (let i = 0; i < pInfoUrlArrArr.length; i++) {
    const result = await pMap(
      pInfoUrlArrArr[i],
      pInfoMapper({ ...ugg.headers, cookie: await getUggCookie() }),
      {
        concurrency: CONCURRENT_REQUEST_LIMIT,
      }
    );

    pInfoArr.push(result);
  }

  const cleanPInfoArr = pInfoArr.flat().map((e) => ({
    selectedProductUrl: e.product.selectedProductUrl,
    variationAttributes: e.product.variationAttributes,
    productName: e.product.productName,
    productId: e.product.id,
    price: {
      sales: e.product.price.sales.formatted,
      list: e.product.price.list ? e.product.price.list.formatted : '',
    },
  }));

  const items = new Map();

  for (let i = 0; i < cleanPInfoArr.length; i++) {
    const thumbnailUrl = `${ugg.rootUrl}/dw/image/v2/BDFS_PRD${cleanPInfoArr[i].variationAttributes[0].values[0].images.swatch[0].url}`;
    if (!items.has(cleanPInfoArr[i].productName)) {
      items.set(cleanPInfoArr[i].productName, {
        selectedProductUrl: `${ugg.rootUrl}${cleanPInfoArr[i].selectedProductUrl}`,
        name: cleanPInfoArr[i].productName,
        variations: [
          {
            id: cleanPInfoArr[i].productId,
            color: cleanPInfoArr[i].variationAttributes[0].displayValue,
            price: cleanPInfoArr[i].price,
            sizes: cleanPInfoArr[i].variationAttributes[1].values
              .map(mapSizesReturnString)
              .join(','),
            thumbnailUrl: thumbnailUrl
              .substr(0, thumbnailUrl.lastIndexOf('/'))
              .concat(`/${cleanPInfoArr[i].productId}_swatch.jpg`),
          },
        ],
      });
    } else {
      const currentItem = { ...items.get(cleanPInfoArr[i].productName) };
      currentItem.variations = [
        ...currentItem.variations,
        {
          id: cleanPInfoArr[i].productId,
          color: cleanPInfoArr[i].variationAttributes[0].displayValue,
          price: cleanPInfoArr[i].price,
          sizes: cleanPInfoArr[i].variationAttributes[1].values.map(mapSizesReturnString).join(','),
          thumbnailUrl: thumbnailUrl
            .substr(0, thumbnailUrl.lastIndexOf('/'))
            .concat(`/${cleanPInfoArr[i].productId}_swatch.jpg`),
        },
      ];

      items.set(cleanPInfoArr[i].productName, currentItem);
    }
  }

  const HTMLRows = [];
  for (let [, value] of items) {
    HTMLRows.push(HTMLRowMapper(value));
  }

  res.end(wrapTableAroundRows(HTMLRows));
};

const HTMLRowMapper = (item) => {
  const pageLink = `${item.selectedProductUrl}`;
  const arr = item.variations.map(variationMapper);

  return `<tr><td><a href="${pageLink}" target="_blank">${item.name}</a></td>
    <td><ul>
    ${arr.join('')}
    </ul></td></tr>`;
};

const variationMapper = (variation) => {
  return `<li><img src="${variation.thumbnailUrl}" style="border: 1px solid black; width: 32px; height: 32px" /> ${variation.color} - ${variation.price.sales}<del>${variation.price.list}</del> - ${variation.sizes} </li>`;
};

const mapSizesReturnString = (sizeValue) => {
  if (sizeValue.selectable) {
    return sizeValue.displayValue;
  }
};

module.exports = {
  uggController,
};

const wrapTableAroundRows = (rowArr) =>
  `<style>table, th, td {border: 1px solid black;} td { padding: 5px;}</style><table style="width:100%"><tr><th style="text-align:left;">Item</th><th  style="text-align:left;">Stock</th></tr>${rowArr.join(
    ''
  )}</table>`;
