const { Builder, By } = require('selenium-webdriver');
require('chromedriver'); // or 'geckodriver'

(async function runTest() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('https://www.google.com');
    let title = await driver.getTitle();
    console.log('Page title is:', title);
  } finally {
    await driver.quit();
  }
})();
