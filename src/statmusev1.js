const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver'); // This ensures it points to the npm-installed binary

let options = new chrome.Options();
// Optional: Run headless or add more options
// options.addArguments('--headless'); 

let service = new chrome.ServiceBuilder(chromedriver.path);

let driver = new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .setChromeService(service)
  .build();

// Function to get stats for a player
async function getStats(playerName) {
  try {
    const url = `https://www.statmuse.com/nba/ask/${playerName}-stats-his-last-10-game`;
    console.log(`Navigating to URL: ${url}`);
    await driver.get(url);
    await driver.sleep(5000); // Wait for the page to load

    // Accept cookie consent if available
    try {
      await driver.wait(until.elementLocated(By.xpath('//*[@id="qc-cmp2-ui"]/div[2]/div/button[3]')), 20000);
      const acceptAllButton = await driver.findElement(By.xpath('//*[@id="qc-cmp2-ui"]/div[2]/div/button[3]'));
      await acceptAllButton.click();
      console.log('Accepted cookie consent.');
    } catch (err) {
      console.log('No cookie consent button found or already accepted.');
    }

    await driver.wait(until.elementLocated(By.xpath('//table//tr')), 5000); // Wait for table rows to load
    const statsTable = await driver.findElement(By.xpath('//table'));
    const rows = await statsTable.findElements(By.xpath('.//tr'));

    const playerStats = [];

    let rowCount = 0;
    for (let row of rows) {
      if (rowCount >= 10) break; // Stop after 10 rows (or the number of games you want to scrape)

      const columns = await row.findElements(By.xpath('.//td'));
      let rowData = [];

      for (let column of columns) {
        const text = await column.getText();
        rowData.push(text);
      }

      if (rowData.length > 0 && rowData[0] !== '') {
        console.log(`RAW rowData [${rowCount + 1}]:`, rowData);

        let structuredRowData = {};

        // Correctly extract the player's name
        structuredRowData['PLAYER_NAME'] = playerName.replace('-', ' ').toUpperCase() || ''; // Use playerName argument

        // Extract the correct DATE value from the row (this should be in index 2)
        structuredRowData['DATE'] = rowData[3] || '';  // Ensure this is the correct index for the date (it should be in the 4th position)

        // Correct handling of GAME, TEAM, OPPONENT
        structuredRowData['GAME'] = rowData[0] || ''; // Ensure the correct game number (game 1, 2, 3, etc.)

        const vsIndex = rowData.indexOf('vs');
        const atIndex = rowData.indexOf('@');
        
        if (vsIndex !== -1) {
          structuredRowData['TEAM'] = rowData[4] || '';
          structuredRowData['OPPONENT'] = rowData[vsIndex + 1] || '';
        } else if (atIndex !== -1) {
          structuredRowData['TEAM'] = rowData[4] || '';
          structuredRowData['OPPONENT'] = rowData[atIndex + 1] || '';
        } else {
          structuredRowData['TEAM'] = '';
          structuredRowData['OPPONENT'] = '';
        }

        // Clean the rowData by removing unwanted entries like "vs", "@", and TEAM/Opponent data
        const cleanRow = rowData.filter(item => item !== 'vs' && item !== '@' && item !== structuredRowData['TEAM'] && item !== structuredRowData['OPPONENT']);
        
        // Ensure stats are mapped to the correct keys based on the provided format
// Ensure stats are mapped to the correct keys based on the provided format
structuredRowData['MIN'] = cleanRow[4] || '';  // Correct MIN value (index 4 instead of 5)
structuredRowData['PTS'] = cleanRow[5] || '';  // Correct PTS value (index 5 instead of 6)
structuredRowData['REB'] = cleanRow[6] || '';  // Correct REB value (index 6 instead of 7)
structuredRowData['AST'] = cleanRow[7] || '';  // Correct AST value (index 7 instead of 8)
structuredRowData['STL'] = cleanRow[8] || '';  // Correct STL value (index 8 instead of 9)
structuredRowData['BLK'] = cleanRow[9] || '';  // Correct BLK value (index 9 instead of 10)
structuredRowData['FGM'] = cleanRow[10] || ''; // Correct FGM value (index 10 instead of 11)
structuredRowData['FGA'] = cleanRow[11] || ''; // Correct FGA value (index 11 instead of 12)
structuredRowData['FG%'] = cleanRow[12] || ''; // Correct FG% value (index 12 instead of 13)
structuredRowData['3PM'] = cleanRow[13] || ''; // Correct 3PM value (index 13 instead of 14)
structuredRowData['3PA'] = cleanRow[14] || ''; // Correct 3PA value (index 14 instead of 15)
structuredRowData['3P%'] = cleanRow[15] || ''; // Correct 3P% value (index 15 instead of 16)
structuredRowData['FTM'] = cleanRow[16] || ''; // Correct FTM value (index 16 instead of 17)
structuredRowData['FTA'] = cleanRow[17] || ''; // Correct FTA value (index 17 instead of 18)
structuredRowData['FT%'] = cleanRow[18] || ''; // Correct FT% value (index 18 instead of 19)
structuredRowData['TS%'] = cleanRow[19] || ''; // Correct TS% value (index 19 instead of 20)
structuredRowData['OREB'] = cleanRow[20] || ''; // Correct OREB value (index 20 instead of 21)
structuredRowData['DREB'] = cleanRow[21] || ''; // Correct DREB value (index 21 instead of 22)
structuredRowData['TOV'] = cleanRow[22] || ''; // Correct TOV value (index 22 instead of 23)
structuredRowData['PF'] = cleanRow[23] || '';  // Correct PF value (index 23 instead of 24)
structuredRowData['+/-'] = cleanRow[24] || ''; // Correct +/- value (index 24 instead of 25)


        playerStats.push(structuredRowData);
      }
      rowCount++;
    }

    return playerStats;
  } catch (error) {
    console.log('Error:', error);
    return null;
  }
}

// Main function
(async function run() {
  const players = ['james-lebron', 'josh giddey', 'jusuf nurkic', 'miles bridge']; // Example players
  const stats = {};

  for (let playerName of players) {
    const playerStats = await getStats(playerName);
    if (playerStats) {
      stats[playerName] = playerStats;
    } else {
      stats[playerName] = 'Error retrieving stats';  // Handle error gracefully
    }
  }

  // Pretty print the final stats object
  console.log(JSON.stringify(stats, null, 2));  
  await driver.quit();
})();





