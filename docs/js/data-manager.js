function loadSampleTransactions() {
  const firstPortfolio = portfolios.filter(p => p.id !== 'total')[0]?.id;
  
  return [
    {
      id: 1730000001,
      type: 'buy',
      portfolio: firstPortfolio,
      symbol: 'DEMO-TECH',
      shares: 100,
      price: 100,
      date: '2025-02-02T00:00:00Z'
    },
    {
      id: 1730000002,
      type: 'dividend',
      portfolio: firstPortfolio,
      symbol: 'DEMO-TECH',
      shares: 10,
      price: 0,
      date: '2025-03-03T00:00:00Z'
    },
    {
      id: 1730000003,
      type: 'dividend',
      portfolio: firstPortfolio,
      symbol: 'DEMO-TECH',
      shares: 0,
      price: 400,
      date: '2025-04-04T00:00:00Z'
    },
    {
      id: 1730000004,
      type: 'premium',
      portfolio: firstPortfolio,
      symbol: 'DEMO-TECH',
      shares: 100,
      price: 2,
      date: '2025-05-05T00:00:00Z',
      premiumType: 'covered_call',
      premium_type: 'covered_call'
    },
    {
      id: 1730000005,
      type: 'premium',
      portfolio: firstPortfolio,
      symbol: 'DEMO-TECH',
      shares: 100,
      price: 2.5,
      date: '2025-06-06T00:00:00Z',
      premiumType: 'csp_expired',
      premium_type: 'csp_expired'
    },
    {
      id: 1730000006,
      type: 'buy',
      portfolio: firstPortfolio,
      symbol: 'DEMO-RETAIL',
      shares: 100,
      price: 125,
      date: '2025-06-06T00:00:00Z'
    },
    {
      id: 1730000007,
      type: 'sell',
      portfolio: firstPortfolio,
      symbol: 'DEMO-RETAIL',
      shares: -100,
      price: 150,
      date: '2025-08-08T00:00:00Z'
    }
  ];
}

function checkAndLoadSampleData() {
  const existingData = localStorage.getItem('portfolio_transactions');
  const sampleDataLoaded = localStorage.getItem('sampleDataLoaded');
  
  // Only load sample data if NO data exists and we haven't loaded samples before
  if (!existingData && !sampleDataLoaded) {
    // Wait a bit for portfolios to initialize
    setTimeout(() => {
      let firstPortfolio = portfolios.filter(p => p.id !== 'total')[0]?.id;
      
      // If no portfolio exists, create one for sample data
      if (!firstPortfolio) {
        const samplePortfolioId = 'portfolio-' + Date.now();
        portfolios.push({
          id: samplePortfolioId,
          name: 'Portfolio 1',
          color: 1
        });
        savePortfolios();
        firstPortfolio = samplePortfolioId;
        
        // Reinitialize portfolio UI
        initializePortfolios();
        
        console.log('✅ Created sample portfolio:', firstPortfolio);
      }
      
      if (firstPortfolio) {
        transactions = loadSampleTransactions();
        manualPrices = { 'DEMO-TECH': 110, 'DEMO-RETAIL': 150 };
        livePrices = { ...manualPrices };
        
        // Mark that we've loaded sample data once
        localStorage.setItem('sampleDataLoaded', 'true');
        
        console.log('✅ Loaded sample data with', transactions.length, 'transactions');
        
        // Refresh the display with sample data
        refreshPricesAndNames();
        
        setTimeout(showSampleDataBanner, 500);
      }
    }, 100);
    return true;
  }
  return false;
}

function showSampleDataBanner() {
  const banner = document.createElement('div');
  banner.id = 'sampleBanner';
  banner.innerHTML = `
    <div style="position: fixed; top: 70px; right: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 16px 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 9999; max-width: 350px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: white !important;">
        <strong style="color: white !important;">🎉 Demo Mode</strong>
        <button onclick="this.closest('#sampleBanner').remove()" style="background: none; border: none; color: white !important; font-size: 18px; cursor: pointer; line-height: 1;">&times;</button>
      </div>
<p style="margin: 0 0 10px 0; font-size: 13px; color: white !important; line-height: 1.5;">Sample transactions loaded. Changes won't save until you add your own data. Go to Settings to add API key or choose Manual Mode.</p>
      <button onclick="clearSampleAndStart()" style="width: 100%; background: white; color: #667eea !important; border: none; padding: 8px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px;">Clear & Start Fresh</button>
    </div>
  `;
  document.body.appendChild(banner);
}

function clearSampleAndStart() {
  // Clear all in-memory data
  transactions = [];
  manualPrices = {};
  livePrices = {};
  cashFlows = [];
  
  // Clear ONLY the sample data flag (keep all other settings)
  localStorage.removeItem('sampleDataLoaded');
  
  // Remove the banner
  const banner = document.getElementById('sampleBanner');
  if (banner) banner.remove();
  
  // Refresh display
  refreshPricesAndNames();
  
  alert('✅ Sample data cleared! You can now add your own transactions.Go to Settings to add API key or choose Manual Mode');
}
function populatePortfolioFilter() {
  const filterPortfolio = document.getElementById('filterPortfolio');
  if (!filterPortfolio) return;
  
  const userPortfolios = portfolios.filter(p => p.id !== 'total');
  
  filterPortfolio.innerHTML = '<option value="">All Portfolios</option>' +
    userPortfolios.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}
function checkFirstVisit() {
  const hasVisited = localStorage.getItem('hasVisitedPortfolio');
  const hasSampleData = localStorage.getItem('sampleDataLoaded');
  const hasTransactions = localStorage.getItem('portfolio_transactions');
  
  // Only show welcome modal if: first visit, no sample data, no real data
  if (!hasVisited && !hasSampleData && !hasTransactions) {
    document.getElementById('welcomeModal').classList.add('active');
    localStorage.setItem('hasVisitedPortfolio', 'true');
  } else {
    // Mark as visited even if we're showing sample data
    localStorage.setItem('hasVisitedPortfolio', 'true');
    // Only check API key if NOT in sample data mode
    if (!hasSampleData) {
      checkApiKey();
    }
  }
}

function checkApiKey() {
  const apiKey = localStorage.getItem('apiKey');
  const priceMode = localStorage.getItem('priceMode');
  const hasSampleData = localStorage.getItem('sampleDataLoaded');
  
  // Don't bug user about API key if:
  // 1. They're in sample data mode, OR
  // 2. They already chose manual mode
  if (hasSampleData || priceMode === 'manual') {
    return;
  }
  
  // Only show if no API key and no mode chosen
  if (!apiKey && !priceMode) {
    document.getElementById('settingsModal').classList.add('active');
  }
}

function saveApiKey() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const statusEl = document.getElementById('apiKeyStatus');
  
  if (!apiKey) {
    statusEl.textContent = 'Please enter a valid API key';
    statusEl.className = 'error';
    return;
  }
  
  localStorage.setItem('apiKey', apiKey);
  statusEl.textContent = '✓ API key saved successfully!';
  statusEl.className = 'success';
  
  setTimeout(() => {
    document.getElementById('settingsModal').classList.remove('active');
  }, 1500);
}

function loadApiKey() {
  const apiKey = localStorage.getItem('apiKey');
  if (apiKey) {
    document.getElementById('apiKeyInput').value = apiKey;
  }
}

// ============ PORTFOLIO MANAGEMENT ============

function initializePortfolios() {
  updatePortfolioDropdown();
  updatePortfolioTabs();
  updatePortfolioList();
}

function updatePortfolioDropdown() {
  const dropdown = document.getElementById('portfolio');
  dropdown.innerHTML = '<option value="">Select Portfolio</option>';
  
  portfolios.filter(p => p.id !== 'total').forEach(portfolio => {
    const option = document.createElement('option');
    option.value = portfolio.id;
    option.textContent = portfolio.name;
    dropdown.appendChild(option);
  });
}

function updatePortfolioTabs() {
  const tabsContainer = document.getElementById('mainTabs');
  
  // Remove existing custom portfolio tabs
  const existingCustomTabs = tabsContainer.querySelectorAll('.tab.custom-portfolio');
  existingCustomTabs.forEach(tab => tab.remove());
  
  // Remove existing custom tab content
  const existingCustomContent = document.querySelectorAll('.tab-content.custom-portfolio');
  existingCustomContent.forEach(content => content.remove());
  
  // Add custom portfolio tabs before "Sold Positions"
  const soldTab = tabsContainer.querySelector('[data-tab="sold"]');
  
  portfolios.filter(p => p.id !== 'total').forEach((portfolio, index) => {
    // Create tab button
    const tab = document.createElement('button');
    tab.className = `tab custom-portfolio ${PORTFOLIO_COLORS[portfolio.color]}`;
    tab.dataset.tab = portfolio.id;
    tab.textContent = portfolio.name;
    tabsContainer.insertBefore(tab, soldTab);
    
    // Create tab content
    const content = document.createElement('div');
    content.id = portfolio.id;
    content.className = 'tab-content custom-portfolio';
    content.innerHTML = `
      <div class="table-responsive">
        <table id="${portfolio.id}Table">
      <thead>
  <tr>
    <th data-sort="select" style="width: 40px;"><input type="checkbox" class="select-all"></th>
    <th data-sort="symbol">Symbol</th>
    <th data-sort="shares">Shares</th>
    <th data-sort="avgCost">Avg Cost</th>
    <th data-sort="currentPrice">Current Price</th>
    <th data-sort="totalCost">Cost Basis</th>
    <th data-sort="currentValue">Current Value</th>
    <th data-sort="gainLoss">Unrealized Gain/Loss</th>
    <th data-sort="gainLossPercent">Gain/Loss %</th>
    <th data-sort="xirr">XIRR</th>
    <th data-sort="weightedDays" class="weighted-days-held">Weighted Avg Days Held</th>
    <th data-sort="percentPortfolio">Portfolio %</th>
  </tr>
</thead>
          <tbody></tbody>
        </table>
      </div>
    `;
    
    document.querySelector('.main-content').appendChild(content);
    
    // Add sort state for this portfolio
    sortState[portfolio.id] = { column: 'symbol', direction: 'asc' };
  });
}

function updatePortfolioList() {
  const listEl = document.getElementById('portfolioList');
  listEl.innerHTML = '';
  
  portfolios.filter(p => p.id !== 'total').forEach((portfolio, index) => {
    const item = document.createElement('div');
    item.className = `portfolio-item ${PORTFOLIO_COLORS[portfolio.color]}`;
    item.innerHTML = `
      <input type="text" value="${portfolio.name}" data-id="${portfolio.id}" class="portfolio-name-input">
      <button class="btn-delete" onclick="deletePortfolio('${portfolio.id}')">Delete</button>
    `;
    listEl.appendChild(item);
  });
  
  // Add listeners for name changes
  document.querySelectorAll('.portfolio-name-input').forEach(input => {
    input.addEventListener('change', function() {
      updatePortfolioName(this.dataset.id, this.value);
    });
  });
}

function addPortfolio() {
  if (portfolios.length >= 6) { // 1 total + 5 custom
    alert('Maximum 5 custom portfolios allowed');
    return;
  }
  
  const portfolioNumber = portfolios.length;
  const newPortfolio = {
    id: `portfolio-${Date.now()}`,
    name: `Portfolio ${portfolioNumber}`,
    color: portfolioNumber
  };
  
  portfolios.push(newPortfolio);
  savePortfolios();
  initializePortfolios();
}

function updatePortfolioName(id, newName) {
  const portfolio = portfolios.find(p => p.id === id);
  if (portfolio) {
    portfolio.name = newName;
    savePortfolios();
    updatePortfolioTabs();
  }
}
function savePortfolios() {
  localStorage.setItem('portfolios', JSON.stringify(portfolios));
}

// ============ DATE CONVERSION ============

function getPortfolioName(portfolioId) {
  const portfolio = portfolios.find(p => p.id === portfolioId);
  return portfolio ? portfolio.name : portfolioId;
}

function getPortfolioColorDot(portfolioId) {
  const portfolio = portfolios.find(p => p.id === portfolioId);
  if (!portfolio || portfolio.id === 'total') return '';
  
  const colorClass = `portfolio-color-${portfolio.color}`;
  return `<span class="portfolio-indicator ${colorClass}"></span>`;
}
async function deletePortfolio(id) {
  if (!confirm('Delete this portfolio? Transactions will remain but lose portfolio assignment.')) {
    return;
  }
  
  portfolios = portfolios.filter(p => p.id !== id);
  savePortfolios();
  
  // Update transactions to remove this portfolio
  transactions.forEach(t => {
    if (t.portfolio === id) {
      t.portfolio = '';
    }
  });
  
  await saveDataToLocalStorage();
  initializePortfolios();
  refreshPricesAndNames();
}

// ============ DATA LOADING & SAVING (localStorage version) ============

async function loadDataFromLocalStorage() {
  try {
    // Load transactions
    const storedTransactions = localStorage.getItem('portfolio_transactions');
    if (storedTransactions) {
      transactions = JSON.parse(storedTransactions);
      console.log('✅ Loaded ' + transactions.length + ' transactions from localStorage');
    } else {
      // No stored data - check if we should load sample data
      checkAndLoadSampleData();
    }
    
    // Load cash flows
    const storedCashFlows = localStorage.getItem('portfolio_cashflows');
    if (storedCashFlows) {
      cashFlows = JSON.parse(storedCashFlows);
      console.log('✅ Loaded ' + cashFlows.length + ' cash flows from localStorage');
    }
    
    // Load cached prices
    const storedPrices = localStorage.getItem('portfolio_prices');
    if (storedPrices) {
      livePrices = JSON.parse(storedPrices);
      console.log('✅ Loaded ' + Object.keys(livePrices).length + ' cached prices from localStorage');
    }
    
    // Load manual prices
    const storedManualPrices = localStorage.getItem('manualPrices');
    if (storedManualPrices) {
      manualPrices = JSON.parse(storedManualPrices);
      // In manual mode, also copy to livePrices for display
      if (priceMode === 'manual') {
        Object.assign(livePrices, manualPrices);
      }
      console.log('✅ Loaded ' + Object.keys(manualPrices).length + ' manual prices from localStorage');
    }
  } catch (error) {
    console.error('❌ Error loading data from localStorage:', error);
  }
}

async function saveDataToLocalStorage() {
  try {
    // Save transactions
    localStorage.setItem('portfolio_transactions', JSON.stringify(transactions));
    
    // Save cash flows
    localStorage.setItem('portfolio_cashflows', JSON.stringify(cashFlows));
    
    // Save price cache
    localStorage.setItem('portfolio_prices', JSON.stringify(livePrices));
    
    console.log('✅ Saved to localStorage');
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
  }
}


async function addTransaction() {
  const type = document.getElementById('type').value;
  const portfolio = document.getElementById('portfolio').value;
  const symbol = document.getElementById('symbol').value.toUpperCase().trim();
  const shares = parseFloat(document.getElementById('shares').value);
  const priceInput = document.getElementById('price').value;
  const price = priceInput === '' ? 0 : parseFloat(priceInput);
  const dateInput = document.getElementById('date').value;
  
  // Special handling for cash dividends
  const isCashDividend = type === 'dividend' && shares === 0;
  
  if (!symbol || !dateInput || !portfolio) {
    alert('Please fill in symbol, portfolio, and date');
    return;
  }
  
  // Validate shares (allow 0 for cash dividends)
  if (!isCashDividend && (isNaN(shares) || shares <= 0)) {
    alert('Please enter valid shares');
    return;
  }
  
  // Validate price (different rules for different types)
  if (type === 'dividend') {
    // DRIP or Cash dividend
    if (isCashDividend && (isNaN(price) || price <= 0)) {
      alert('Please enter dividend amount');
      return;
    }
    // DRIP dividends have price = 0, which is OK
  } else if (type !== 'premium') {
    // Buy/Sell require valid price
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
  }
  
  const date = convertDDMMYYYYtoYYYYMMDD(dateInput) + 'T00:00:00Z';
  
  // Check for duplicates
  const duplicates = checkDuplicateTransaction(symbol, shares, date, type);
  if (duplicates.length > 0) {
    const dup = duplicates[0];
    const dupDate = new Date(dup.date).toLocaleDateString();
    const message = `⚠️ Similar transaction found:\n\n${dup.symbol} - ${Math.abs(dup.shares)} shares @ $${dup.price}\nDate: ${dupDate}\nType: ${dup.type}\n\nAdd this transaction anyway?`;
    
    if (!confirm(message)) {
      return;
    }
  }
  
  const transaction = { 
    type: type, 
    portfolio: portfolio, 
    symbol: symbol, 
    shares: type === 'sell' ? -Math.abs(shares) : shares, // Make SELL shares negative!
    price: price, 
    date: date
  };
  
  if (type === 'premium') {
    transaction.premium_type = document.getElementById('premiumType').value;
  }
  
  if (isValidTransaction(transaction)) {
    transactions.push(transaction);
    await saveDataToLocalStorage();
    
    // Reset ALL form fields to initial state
    document.getElementById('type').value = 'buy';
    document.getElementById('portfolio').value = portfolios.filter(p => p.id !== 'total')[0]?.id || '';
    document.getElementById('symbol').value = '';
    document.getElementById('shares').value = '';
    document.getElementById('price').value = '';
    document.getElementById('date').value = '';
    
    // Hide premium type selector
    const premiumTypeSelect = document.getElementById('premiumType');
    if (premiumTypeSelect) {
      premiumTypeSelect.style.display = 'none';
    }
    
    // Hide dividend type selector
    const dividendTypeSelect = document.getElementById('dividendType');
    if (dividendTypeSelect) {
      dividendTypeSelect.style.display = 'none';
      dividendTypeSelect.value = 'drip'; // Reset to default
    }
    
    // Reset shares and price field states
    const sharesInput = document.getElementById('shares');
    const priceInput = document.getElementById('price');
    if (sharesInput) {
      sharesInput.disabled = false;
      sharesInput.placeholder = 'Shares/Amount';
      sharesInput.style.background = 'white';
      sharesInput.style.color = 'black';
    }
    if (priceInput) {
      priceInput.disabled = false;
      priceInput.placeholder = 'Price';
      priceInput.style.background = 'white';
      priceInput.style.color = 'black';
    }
    
    // Refresh prices based on mode
    if (priceMode === 'manual') {
      // In manual mode, just refresh the display
      refreshPricesAndNames();
    } else {
      // In API mode, fetch price if needed
      if (!livePrices[symbol]) {
        await getLivePrice(symbol);
      } else {
        refreshPricesAndNames();
      }
    }
  } else {
    alert('Invalid transaction data');
  }
}
async function confirmClearData() {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    
    
    
    
    transactions = [];
    cashFlows = [];
    livePrices = {};
    
    refreshPricesAndNames();
    updateCashFlowTable();
  }
}
async function confirmDeleteSelected() {
  const activeTab = document.querySelector('.tab.active');
  const currentTab = activeTab ? activeTab.dataset.tab : 'total';
  
  let tableId = currentTab + 'Table';
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const checkboxes = table.querySelectorAll('tbody .select-row:checked');
  
  if (checkboxes.length === 0) {
    alert('Please select transactions to delete');
    return;
  }
  
  if (!confirm('Are you sure you want to delete ' + checkboxes.length + ' selected transaction(s)?')) {
    return;
  }
  
  const portfolioTabs = ['total', ...portfolios.filter(p => p.id !== 'total').map(p => p.id)];
  
  // Handle portfolio view tabs (delete all transactions for selected symbols)
  if (portfolioTabs.includes(currentTab)) {
    const symbolsToDelete = [];
    checkboxes.forEach(function(checkbox) {
      const row = checkbox.closest('tr');
      const cells = row.cells;
      const symbol = cells[1].textContent;
      symbolsToDelete.push(symbol);
    });
    
    // Remove from local array
    transactions = transactions.filter(t => !symbolsToDelete.includes(t.symbol));
    
    // Save updated data
    await saveDataToLocalStorage();
    
    // Refresh the display
    refreshPricesAndNames();
    
    alert(`✅ Deleted all transactions for ${symbolsToDelete.length} symbol(s)`);
  }
  // Handle "All Transactions" tab (delete specific transactions by index)
  else if (currentTab === 'all') {
    const indicesToDelete = [];
    checkboxes.forEach(function(checkbox) {
      const index = parseInt(checkbox.dataset.index);
      if (!isNaN(index)) {
        indicesToDelete.push(index);
      }
    });
    
    if (indicesToDelete.length === 0) {
      alert('No valid transactions selected');
      return;
    }
    
    // Sort indices in descending order to delete from end to start
    indicesToDelete.sort((a, b) => b - a);
    
    // Remove from local array
    indicesToDelete.forEach(index => {
      if (index >= 0 && index < transactions.length) {
        transactions.splice(index, 1);
      }
    });
    
    // Save updated data
    await saveDataToLocalStorage();
    
    // Refresh the display
    refreshPricesAndNames();
    
    alert(`✅ Deleted ${indicesToDelete.length} transaction(s)`);
  }
  // Handle ticker search and sold positions
  else if (currentTab === 'ticker') {
    const transactionsToDelete = [];
    
    checkboxes.forEach(function(checkbox) {
      // Skip summary row
      if (checkbox.dataset.type === 'summary') return;
      
      // Get data from checkbox attributes
      const type = checkbox.dataset.type;
      const portfolio = checkbox.dataset.portfolio;
      const symbol = checkbox.dataset.symbol;
      const shares = parseFloat(checkbox.dataset.shares);
      const price = parseFloat(checkbox.dataset.price);
      const date = checkbox.dataset.date;
      
      transactionsToDelete.push({ type, portfolio, symbol, shares, price, date });
    });
    
    console.log('Deleting from ticker search:', transactionsToDelete);
    
    if (transactionsToDelete.length === 0) {
      alert('No transactions selected (summary row cannot be deleted)');
      return;
    }
    
    // Delete matching transactions
    transactionsToDelete.forEach(item => {
      const index = transactions.findIndex(t => 
        t.type === item.type &&
        t.portfolio === item.portfolio &&
        t.symbol === item.symbol &&
        t.shares === item.shares &&
        t.price === item.price &&
        t.date === item.date
      );
      
      if (index !== -1) {
        transactions.splice(index, 1);
      }
    });
    
    // Save updated data
    await saveDataToLocalStorage();
    
    // Refresh the display
    refreshPricesAndNames();
    searchTicker();
    
    alert(`✅ Deleted ${transactionsToDelete.length} transaction(s)`);
  }
  else if (currentTab === 'sold') {
    const symbolsToDelete = [];
    checkboxes.forEach(function(checkbox) {
      const row = checkbox.closest('tr');
      const cells = row.cells;
      const symbolText = cells[1].textContent;
      const symbol = symbolText.replace(' (Premium)', '').trim();
      const isPremium = symbolText.includes('(Premium)');
      
      if (isPremium) {
        symbolsToDelete.push({ symbol: symbol, type: 'premium' });
      } else {
        symbolsToDelete.push({ symbol: symbol, type: 'all' });
      }
    });
    
    // Delete transactions
    symbolsToDelete.forEach(item => {
      if (item.type === 'premium') {
        // Delete only premium transactions for this symbol
        transactions = transactions.filter(t => 
          !(t.symbol === item.symbol && t.type === 'premium')
        );
      } else {
        // Delete all transactions for this symbol
        transactions = transactions.filter(t => t.symbol !== item.symbol);
      }
    });
    
    // Save updated data
    await saveDataToLocalStorage();
    
    // Refresh the display
    refreshPricesAndNames();
    
    alert(`✅ Deleted transactions for ${symbolsToDelete.length} symbol(s)`);
  }
  
  refreshPricesAndNames();
}// ADD THIS FUNCTION TO data-manager.js

async function handleCashFlowCsvImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = async function(e) {
    const csvData = e.target.result;
    await processCashFlowCsv(csvData);
  };
  
  reader.readAsText(file);
  
  // Reset file input so same file can be imported again
  event.target.value = '';
}

async function processCashFlowCsv(csvData) {
  const lines = csvData.split('\n').filter(line => line.trim());
  if (lines.length <= 1) {
    alert('CSV file is empty or invalid');
    return;
  }
  
  // Check headers
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const expectedHeaders = ['date', 'amount', 'type'];
  
  const hasCorrectHeaders = expectedHeaders.every(h => headers.includes(h));
  if (!hasCorrectHeaders) {
    alert('Invalid CSV format. Expected headers: date, amount, type');
    return;
  }
  
  const dataLines = lines.slice(1);
  const newCashFlows = [];
  
  dataLines.forEach((line, index) => {
    const values = line.split(',').map(v => v.trim());
    
    // Skip empty lines or summary rows
    if (values.length < 3 || !values[0]) return;
    
    const dateStr = values[0];
    const amount = parseFloat(values[1]);
    const type = values[2].toLowerCase();
    
    // Validate data
    if (!dateStr || isNaN(amount) || !type) {
      console.warn(`Skipping invalid row ${index + 2}:`, line);
      return;
    }
    
    // Parse date (DD/MM/YYYY format)
    let dateObj;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        // Fix typo years like "20205" -> "2025"
        const fixedYear = year.length > 4 ? year.substring(0, 4) : year;
        
        dateObj = new Date(`${fixedYear}-${month}-${day}`);
      }
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn(`Invalid date in row ${index + 2}:`, dateStr);
      return;
    }
    
    const isoDate = dateObj.toISOString().split('T')[0] + 'T00:00:00Z';
    
    // Check for duplicates
    const isDuplicate = cashFlows.some(cf => 
      cf.date === isoDate && 
      cf.amount === amount && 
      cf.type === type
    );
    
    if (isDuplicate) {
      console.warn(`Skipping duplicate cash flow:`, dateStr, amount, type);
      return;
    }
    
    newCashFlows.push({
      date: isoDate,
      amount: amount,
      type: type
    });
  });
  
  if (newCashFlows.length === 0) {
    alert('No new cash flows to import (all may be duplicates)');
    return;
  }
  
  // Add to cashFlows array
  cashFlows.push(...newCashFlows);
  
  // Sort by date
  cashFlows.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Save to localStorage
  await saveDataToLocalStorage();
  
  // Refresh display
  updateCashFlowTable();
  
  alert(`✅ Imported ${newCashFlows.length} cash flow entries!`);
  
  console.log('Cash flows imported:', newCashFlows);
}
