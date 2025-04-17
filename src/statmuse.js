const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let options = new chrome.Options();
// options.addArguments('--headless'); // Optional
let service = new chrome.ServiceBuilder(chromedriver.path);

let driver = new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .setChromeService(service)
  .build();

async function getStats(playerName) {
  try {
    const url = `https://www.statmuse.com/nba/ask/${playerName}-stats-his-last-10-game`;
    console.log(`Navigating to URL: ${url}`);
    await driver.get(url);
    await driver.sleep(5000);

    try {
      await driver.wait(until.elementLocated(By.xpath('//*[@id="qc-cmp2-ui"]/div[2]/div/button[3]')), 5000);
      const acceptAllButton = await driver.findElement(By.xpath('//*[@id="qc-cmp2-ui"]/div[2]/div/button[3]'));
      await acceptAllButton.click();
      console.log('Accepted cookie consent.');
    } catch {
      console.log('No cookie consent button found or already accepted.');
    }

    await driver.wait(until.elementLocated(By.xpath('//table//tr')), 5000);
    const rows = await driver.findElements(By.xpath('//table//tr'));
    const stats = [];

    let rowCount = 0;
    for (let row of rows) {
      if (rowCount >= 10) break;
      const columns = await row.findElements(By.xpath('.//td'));
      let rowData = [];

      for (let column of columns) {
        rowData.push(await column.getText());
      }

      if (rowData.length > 0 && rowData[0] !== '') {
        const stat = {};
        stat['PLAYER_NAME'] = playerName.replace('-', ' ').toUpperCase();
        stat['DATE'] = rowData[3] || '';
        stat['GAME'] = rowData[0] || '';

        const vsIndex = rowData.indexOf('vs');
        const atIndex = rowData.indexOf('@');
        if (vsIndex !== -1) {
          stat['TEAM'] = rowData[4] || '';
          stat['OPPONENT'] = rowData[vsIndex + 1] || '';
        } else if (atIndex !== -1) {
          stat['TEAM'] = rowData[4] || '';
          stat['OPPONENT'] = rowData[atIndex + 1] || '';
        } else {
          stat['TEAM'] = '';
          stat['OPPONENT'] = '';
        }

        const cleanRow = rowData.filter(
          item => item !== 'vs' && item !== '@' && item !== stat['TEAM'] && item !== stat['OPPONENT']
        );

        stat['MIN'] = cleanRow[4] || '';
        stat['PTS'] = cleanRow[5] || '';
        stat['REB'] = cleanRow[6] || '';
        stat['AST'] = cleanRow[7] || '';
        stat['STL'] = cleanRow[8] || '';
        stat['BLK'] = cleanRow[9] || '';
        stat['FGM'] = cleanRow[10] || '';
        stat['FGA'] = cleanRow[11] || '';
        stat['FG%'] = cleanRow[12] || '';
        stat['3PM'] = cleanRow[13] || '';
        stat['3PA'] = cleanRow[14] || '';
        stat['3P%'] = cleanRow[15] || '';
        stat['FTM'] = cleanRow[16] || '';
        stat['FTA'] = cleanRow[17] || '';
        stat['FT%'] = cleanRow[18] || '';
        stat['TS%'] = cleanRow[19] || '';
        stat['OREB'] = cleanRow[20] || '';
        stat['DREB'] = cleanRow[21] || '';
        stat['TOV'] = cleanRow[22] || '';
        stat['PF'] = cleanRow[23] || '';
        stat['+/-'] = cleanRow[24] || '';

        stats.push(stat);
        rowCount++;
      }
    }

    return stats;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function writeStatsToCSV(stats) {
  const flatStats = Object.values(stats).flat();

  const csvWriter = createCsvWriter({
    path: './player_stats.csv',
    header: [
      { id: 'PLAYER_NAME', title: 'PLAYER_NAME' },
      { id: 'DATE', title: 'DATE' },
      { id: 'GAME', title: 'GAME' },
      { id: 'TEAM', title: 'TEAM' },
      { id: 'OPPONENT', title: 'OPPONENT' },
      { id: 'MIN', title: 'MIN' },
      { id: 'PTS', title: 'PTS' },
      { id: 'REB', title: 'REB' },
      { id: 'AST', title: 'AST' },
      { id: 'STL', title: 'STL' },
      { id: 'BLK', title: 'BLK' },
      { id: 'FGM', title: 'FGM' },
      { id: 'FGA', title: 'FGA' },
      { id: 'FG%', title: 'FG%' },
      { id: '3PM', title: '3PM' },
      { id: '3PA', title: '3PA' },
      { id: '3P%', title: '3P%' },
      { id: 'FTM', title: 'FTM' },
      { id: 'FTA', title: 'FTA' },
      { id: 'FT%', title: 'FT%' },
      { id: 'TS%', title: 'TS%' },
      { id: 'OREB', title: 'OREB' },
      { id: 'DREB', title: 'DREB' },
      { id: 'TOV', title: 'TOV' },
      { id: 'PF', title: 'PF' },
      { id: '+/-', title: '+/-' },
    ]
  });

  await csvWriter.writeRecords(flatStats);
  console.log('CSV file written as player_stats.csv');
}

(async function run() {
  const fs = require('fs');
  const players = JSON.parse(fs.readFileSync('./players.json'));
  const stats = {};

  for (let player of players) {
    const playerStats = await getStats(player);
    if (playerStats) {
      stats[player] = playerStats;
    } else {
      stats[player] = [];
    }
  }

  await writeStatsToCSV(stats);
  await driver.quit();
})();
