function updateTables(symbolData, portfolioData, soldData) {
  const tables = {
    total: document.getElementById('totalTable'),
    sold: document.getElementById('soldTable'),
    all: document.getElementById('allTable')
  };
  
  // Add custom portfolio tables
  portfolios.filter(p => p.id !== 'total').forEach(p => {
    tables[p.id] = document.getElementById(p.id + 'Table');
  });
  
  for (const portfolio in tables) {
    const table = tables[portfolio];
    if (!table) continue;
    const tbody = table.querySelector('tbody');
    if (!tbody) continue;
    tbody.innerHTML = '';
    
    if (portfolio === 'all') {
  let filteredTransactions = transactions;
  
  // Apply ticker modal filter (from clickable tickers)
  if (activeTickerFilter) {
    filteredTransactions = filteredTransactions.filter(t => t.symbol === activeTickerFilter);
  }
  
  // Apply dropdown/search filters
  if (transactionFilters.type) {
    filteredTransactions = filteredTransactions.filter(t => t.type === transactionFilters.type);
  }
  if (transactionFilters.portfolio) {
    filteredTransactions = filteredTransactions.filter(t => t.portfolio === transactionFilters.portfolio);
  }
  if (transactionFilters.symbol) {
    filteredTransactions = filteredTransactions.filter(t => 
      t.symbol.toLowerCase().includes(transactionFilters.symbol.toLowerCase())
    );
  }
  filteredTransactions.forEach(function(t, index) {
  // Find the actual index in the main transactions array
  const actualIndex = transactions.findIndex(tx => tx.id === t.id);  
  const row = document.createElement('tr');
  row.ondblclick = function() { showEditModal(actualIndex); };
  row.style.cursor = 'pointer';
  row.title = 'Double-click to edit';
  const portfolioName = getPortfolioName(t.portfolio);
  const portfolioColor = getPortfolioColorDot(t.portfolio);
  row.innerHTML = '<td><input type="checkbox" class="select-row" data-index="' + actualIndex + '"></td><td>' + t.type.toUpperCase() + '</td><td>' + portfolioColor + portfolioName + '</td><td>' + makeTickerClickable(t.symbol) + '</td><td>' + t.shares.toFixed(2) + '</td><td>$' + t.price.toFixed(2) + '</td><td>' + formatDateDDMMYYYY(t.date) + '</td>';
  tbody.appendChild(row);
});
}
    else if (portfolio === 'sold') {
      for (const key in soldData) {
        const data = soldData[key];
        const symbol = data.symbol || key;
        const row = document.createElement('tr');
        
        const firstBuyDate = new Date(data.firstBuy);
        const lastSellDate = new Date(data.lastSell);
        const daysHeld = Math.ceil((lastSellDate - firstBuyDate) / (1000 * 60 * 60 * 24));
        
        const dates = [new Date(data.firstBuy), new Date(data.lastSell)];
        const values = [-data.totalCost, data.totalProceeds];

        const xirr = calculateXIRR(dates, values);
        
        const currentPrice = livePrices[symbol] || 0;
        const unrealizedGain = currentPrice > 0 ? ((currentPrice - data.avgBuyPrice) * data.sharesSold) - data.realizedGain : 0;
        
        const portfolioName = getPortfolioName(data.portfolio);
const portfolioColor = getPortfolioColorDot(data.portfolio);
        
       row.innerHTML = '<td><input type="checkbox" class="select-row"></td>' +
          '<td>' + makeTickerClickable(symbol) + (data.isPremium ? ' (Premium)' : '') + '</td>' +
          '<td>' + portfolioColor + portfolioName + '</td>' +
          '<td>' + data.sharesSold.toFixed(2) + '</td>' +
          '<td>$' + data.avgBuyPrice.toFixed(2) + '</td>' +
          '<td>$' + data.avgSellPrice.toFixed(2) + '</td>' +
          '<td>$' + (currentPrice || 0).toFixed(2) + '</td>' +
          '<td class="' + (data.realizedGain < 0 ? 'negative' : 'positive') + '">$' + data.realizedGain.toFixed(2) + '</td>' +
          '<td class="' + (data.gainPercent < 0 ? 'negative' : 'positive') + '">' + data.gainPercent + '%</td>' +
          '<td>' + daysHeld + '</td>' +
'<td>' + (daysHeld < 90 ? '>90 days' : (xirr * 100).toFixed(2) + '%') + '</td>' +
          '<td class="' + (unrealizedGain < 0 ? 'positive' : 'negative') + '">$' + unrealizedGain.toFixed(2) + '</td>';
        tbody.appendChild(row);
      }
    } else {
      for (const symbol in symbolData) {
        const data = symbolData[symbol];
        if (!data.netShares || data.netShares <= 0.001) continue;
        if (portfolio !== 'total' && data.portfolio !== portfolio) continue;

        const row = document.createElement('tr');
        let portfolioTotalValue = portfolioData.totalValue;

        if (portfolio !== 'total') {
          portfolioTotalValue = 0;
          for (const sym in symbolData) {
            const d = symbolData[sym];
            if (d.portfolio === portfolio && d.netShares > 0) {
              portfolioTotalValue += d.currentValue;
            }
          }
        }

        var portfolioPercent = (portfolioTotalValue > 0) ? (data.currentValue / portfolioTotalValue * 100).toFixed(2) : '0.00';
row.innerHTML = '<td><input type="checkbox" class="select-row"></td><td>' + makeTickerClickable(symbol) + '</td><td>' + (data.netShares || 0).toFixed(2) + '</td><td>$' + (data.avgCost || 0).toFixed(2) + '</td><td>' + generatePriceCell(symbol, data.currentPrice) + '</td><td>$' + (data.totalCost || 0).toFixed(2) + '</td><td>$' + (data.currentValue || 0).toFixed(2) + '</td><td class="' + (data.gainLoss < 0 ? 'negative' : '') + '">$' + (data.gainLoss || 0).toFixed(2) + '</td><td class="' + ((data.gainLossPercent || 0) < 0 ? 'negative' : '') + '">' + (data.gainLossPercent || 0) + '%</td><td>' + (data.weightedDays < 90 ? '>90 days' : ((data.xirr || 0) * 100).toFixed(2) + '%') + '</td><td>' + Math.round(data.weightedDays || 0) + ' days</td><td>' + portfolioPercent + '%</td>';      
  tbody.appendChild(row);
      }
    }
  }

  for (const portfolio in sortState) {
    const state = sortState[portfolio];
    const table = tables[portfolio];
    if (table && state) sortTable(table, state.column, state.direction);
  }
}

function updateSummary(symbolData, portfolioData, currentPortfolio, soldData) {
  currentPortfolio = currentPortfolio || 'total';
  
  if (currentPortfolio === 'sold') {
    let totalRealizedGain = 0;
    const portfolioRealizedGains = {};
    
    portfolios.filter(p => p.id !== 'total').forEach(p => {
      portfolioRealizedGains[p.id] = 0;
    });
    
    for (const key in soldData) {
      const data = soldData[key];
      totalRealizedGain += data.realizedGain;
      if (portfolioRealizedGains[data.portfolio] !== undefined) {
        portfolioRealizedGains[data.portfolio] += data.realizedGain;
      }
    }
    
    document.getElementById('totalValue').textContent = '$' + totalRealizedGain.toFixed(2);
    document.getElementById('totalCost').textContent = 'Total Realized Gain';
    
    const portfolioNames = portfolios.filter(p => p.id !== 'total').map(p => p.name);
    if (portfolioNames.length > 0) {
      document.getElementById('realizedGainLoss').textContent = '$' + portfolioRealizedGains[portfolios[1].id].toFixed(2);
      document.getElementById('realizedGainPercent').textContent = portfolioNames[0];
    }
    
    if (portfolioNames.length > 1) {
  document.getElementById('totalGainLoss').textContent = '$' + portfolioRealizedGains[portfolios[2].id].toFixed(2);
  document.getElementById('totalGainLossPercent').textContent = portfolioNames[1];
}

const xirrCard = document.getElementById('portfolioXIRR');
if (xirrCard) {
  xirrCard.closest('.summary-card').style.display = 'none';
}

const daysCard = document.getElementById('weightedDaysHeld');
if (daysCard) {
  daysCard.closest('.summary-card').style.display = 'none';
}

return;
}

const xirrElement = document.getElementById('portfolioXIRR');
if (xirrElement) {
  xirrElement.closest('.summary-card').style.display = 'block';
}

const daysElement = document.getElementById('weightedDaysHeld');
if (daysElement) {
  daysElement.closest('.summary-card').style.display = 'block';
}

let filteredSymbolData = symbolData;
let displayValue = portfolioData.totalValue;
let displayCost = portfolioData.totalCost;
let holdings = {};

  portfolios.filter(p => p.id !== 'total').forEach(p => {
    holdings[p.id] = portfolioData[p.id] || 0;
  });
  
  let totalRealizedGain = 0;
  let totalRealizedCost = 0;
  
  for (const key in soldData) {
    const data = soldData[key];
    if (currentPortfolio === 'total' || data.portfolio === currentPortfolio) {
      totalRealizedGain += data.realizedGain;
      totalRealizedCost += data.totalCost;
    }
  }
  
  if (currentPortfolio !== 'total') {
    filteredSymbolData = {};
    displayValue = 0;
    displayCost = 0;
    
    for (const symbol in symbolData) {
      if (symbolData[symbol].portfolio === currentPortfolio && symbolData[symbol].netShares > 0) {
        filteredSymbolData[symbol] = symbolData[symbol];
        displayValue += symbolData[symbol].currentValue;
        displayCost += symbolData[symbol].totalCost;
      }
    }
  }
  
  document.getElementById('totalValue').textContent = '$' + displayValue.toFixed(2);
  document.getElementById('totalCost').textContent = '$' + displayCost.toFixed(2);

  const totalGainLoss = displayValue - displayCost;
  document.getElementById('totalGainLoss').textContent = '$' + totalGainLoss.toFixed(2);
  document.getElementById('totalGainLossPercent').textContent = (displayCost ? (totalGainLoss / displayCost * 100).toFixed(2) : 0.00) + '%';
  
  document.getElementById('realizedGainLoss').textContent = '$' + totalRealizedGain.toFixed(2);
  const realizedGainPercent = totalRealizedCost > 0 ? (totalRealizedGain / totalRealizedCost * 100).toFixed(2) : '0.00';
  document.getElementById('realizedGainPercent').textContent = realizedGainPercent + '%';
  
  const totalHoldings = Object.values(filteredSymbolData).filter(function(d) {
    return d.netShares > 0;
  }).length;
  
  if (currentPortfolio === 'total') {
    document.getElementById('stockCount').textContent = totalHoldings + ' Holdings';
    const breakdownParts = portfolios.filter(p => p.id !== 'total').map(p => {
      return p.name + ': ' + (holdings[p.id] || 0);
    });
    document.getElementById('holdingsBreakdown').textContent = breakdownParts.join(' | ');
  } else {
    document.getElementById('stockCount').textContent = totalHoldings + ' Holdings';
    const currentPortfolioName = portfolios.find(p => p.id === currentPortfolio)?.name || currentPortfolio.toUpperCase();
    document.getElementById('holdingsBreakdown').textContent = currentPortfolioName + ' Portfolio';
  }
  
  const filteredTransactions = currentPortfolio === 'total' ? transactions : transactions.filter(function(t) {
    return t.portfolio === currentPortfolio;
  });
  
  const portfolioXIRR = calculatePortfolioXIRR(filteredTransactions, filteredSymbolData, livePrices);
  document.getElementById('portfolioXIRR').textContent = (portfolioXIRR * 100).toFixed(2) + '%';

  let totalWeightedDays = 0;
  let totalValue = 0;

  for (const symbol in filteredSymbolData) {
    const data = filteredSymbolData[symbol];
    if (data.netShares > 0) {
      totalWeightedDays += data.currentValue * data.weightedDays;
      totalValue += data.currentValue;
    }
  }

  const weightedDaysHeld = totalValue > 0 ? totalWeightedDays / totalValue : 0;
  document.getElementById('weightedDaysHeld').textContent = Math.round(weightedDaysHeld) + ' days';
}

function updateSoldSidebar(soldData) {
  const sidebar = document.getElementById('soldSidebar');
  
  if (!sidebar) return;
  
  // Calculate realized and unrealized gains
  let totalRealizedGain = 0;
  let totalUnrealizedGain = 0;  // From positions still held
  const portfolioStats = {};
  
  // Initialize portfolio stats
  portfolios.filter(p => p.id !== 'total').forEach(p => {
    portfolioStats[p.id] = {
      name: p.name,
      color: p.color,
      realizedGain: 0,
      unrealizedGain: 0,
      soldPositions: 0
    };
  });
  
  // Calculate realized gains from sold positions
  for (const key in soldData) {
    const data = soldData[key];
    const portfolioId = data.portfolio;
    
    totalRealizedGain += data.realizedGain;
    
    if (portfolioStats[portfolioId]) {
      portfolioStats[portfolioId].realizedGain += data.realizedGain;
      portfolioStats[portfolioId].soldPositions++;
    }
  }
  
  // Calculate unrealized gains from current holdings
  for (const symbol in globalSymbolData) {
    const data = globalSymbolData[symbol];
    if (data.netShares > 0) {
      const unrealizedGain = data.gainLoss || 0;
      totalUnrealizedGain += unrealizedGain;
      
      const portfolioId = data.portfolio;
      if (portfolioStats[portfolioId]) {
        portfolioStats[portfolioId].unrealizedGain += unrealizedGain;
      }
    }
  }
  
  // Build sidebar HTML using same structure as dividends/premiums
  let html = '';
  
  html += `
    <div class="summary-card">
      <h3>Total Realized Gain</h3>
      <div class="value ${totalRealizedGain >= 0 ? 'positive' : 'negative'}">
        $${totalRealizedGain.toFixed(2)}
      </div>
      <div class="change">From sold positions</div>
    </div>
  `;
  
  html += `
    <div class="summary-card">
      <h3>Total Unrealized Gain</h3>
      <div class="value ${totalUnrealizedGain >= 0 ? 'positive' : 'negative'}">
        $${totalUnrealizedGain.toFixed(2)}
      </div>
      <div class="change">From current holdings</div>
    </div>
  `;
  
  const combinedTotal = totalRealizedGain + totalUnrealizedGain;
  html += `
    <div class="summary-card" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-color: #667eea;">
      <h3>Combined Total</h3>
      <div class="value ${combinedTotal >= 0 ? 'positive' : 'negative'}">
        $${combinedTotal.toFixed(2)}
      </div>
      <div class="change">Realized + Unrealized</div>
    </div>
  `;
  
  // Per-portfolio breakdown
  portfolios.filter(p => p.id !== 'total').forEach(p => {
    const stats = portfolioStats[p.id];
    if (!stats) return;
    
    const colorClass = `portfolio-color-${stats.color}`;
    const portfolioTotal = stats.realizedGain + stats.unrealizedGain;
    
    html += `
      <div class="summary-card">
        <h3>
          <span class="portfolio-indicator ${colorClass}"></span>
          ${stats.name}
        </h3>
        <div class="value ${portfolioTotal >= 0 ? 'positive' : 'negative'}">
          $${portfolioTotal.toFixed(2)}
        </div>
        <div class="change">
          Realized: <span class="${stats.realizedGain >= 0 ? 'positive' : 'negative'}">
            $${stats.realizedGain.toFixed(2)}
          </span>
        </div>
        <div class="change">
          Unrealized: <span class="${stats.unrealizedGain >= 0 ? 'positive' : 'negative'}">
            $${stats.unrealizedGain.toFixed(2)}
          </span>
        </div>
        ${stats.soldPositions > 0 ? `<div class="change" style="margin-top: 4px;">${stats.soldPositions} sold</div>` : ''}
      </div>
    `;
  });
  
  sidebar.innerHTML = html;
}

async function init() {
    initializePriceMode();  // <-- ADD THIS LINE
  checkFirstVisit();
  initializePortfolios();
  initializeTabs();
  initializePremiumFilters();  
  initializeSortListeners();
  
  console.log('Before loadDataFromLocalStorage');
  
  try {
    await loadDataFromLocalStorage();
    console.log('After loadDataFromLocalStorage, transactions:', transactions.length);
  } catch (error) {
    console.error('Error loading data:', error);
  }
  
  console.log('About to call refreshPricesAndNames, transactions:', transactions.length);
  refreshPricesAndNames();
  console.log('Called refreshPricesAndNames, globalSymbolData keys:', Object.keys(globalSymbolData).length);

  // Check for symbols with missing prices and fetch them (only in API mode)
  const symbolsWithoutPrices = [];
  for (const symbol in globalSymbolData) {
    if (!livePrices[symbol] || livePrices[symbol] === 0) {
      symbolsWithoutPrices.push(symbol);
    }
  }
  
  if (symbolsWithoutPrices.length > 0 && priceMode === 'api') {
    console.log('Fetching prices for', symbolsWithoutPrices.length, 'symbols without cached prices');
    await fetchLivePrices(symbolsWithoutPrices);
    refreshPricesAndNames(); // Refresh display with new prices
  } else {
    console.log('All symbols have cached prices or in manual mode');
  }
  
  // CSV Template Download
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
if (downloadTemplateBtn) {
  downloadTemplateBtn.addEventListener('click', downloadCsvTemplate);
}
  // Modal handlers
  document.getElementById('closeWelcomeBtn').addEventListener('click', function() {
    document.getElementById('welcomeModal').classList.remove('active');
    checkApiKey();
  });

  document.getElementById('settingsBtn').addEventListener('click', function() {
    loadApiKey();
    document.getElementById('settingsModal').classList.add('active');
  });

  document.getElementById('helpBtn').addEventListener('click', function() {
    document.getElementById('welcomeModal').classList.add('active');
  });

  document.querySelector('#settingsModal .close').addEventListener('click', function() {
    document.getElementById('settingsModal').classList.remove('active');
  });

  document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);
  document.getElementById('addPortfolioBtn').addEventListener('click', addPortfolio);
  
  // Add dividend type handler only if element exists
  const dividendTypeEl = document.getElementById('dividendType');
  if (dividendTypeEl) {
    dividendTypeEl.addEventListener('change', handleDividendTypeChange);
  }

  // Window click to close modal
  window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.classList.remove('active');
    }
  });
  
  // Transaction and cash flow handlers
  document.getElementById('addCashFlowBtn').addEventListener('click', addCashFlow);
  document.getElementById('addTransactionBtn').addEventListener('click', addTransaction);
  document.getElementById('clearDataBtn').addEventListener('click', confirmClearData);
  document.getElementById('deleteSelected').addEventListener('click', confirmDeleteSelected);
// CSV Import
document.getElementById('importCsvBtn').addEventListener('click', function() {
  document.getElementById('csvFileInput').click();
});
document.getElementById('csvFileInput').addEventListener('change', handleCsvImport);
// All Transactions filters
document.getElementById('filterType').addEventListener('change', applyTransactionFilters);
document.getElementById('filterPortfolio').addEventListener('change', applyTransactionFilters);
document.getElementById('filterSymbol').addEventListener('input', debounce(applyTransactionFilters, 300));
document.getElementById('clearFiltersBtn').addEventListener('click', clearTransactionFilters);

// Populate portfolio filter dropdown
populatePortfolioFilter();

// CSV Export
const exportBtn = document.getElementById('exportCsvBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', exportTransactionsToCSV);
} else {
  console.warn('Export CSV button not found in HTML');
}

// Ticker Search with Debounce
const tickerSearchInput = document.getElementById('tickerSearchInput');
const searchTickerBtn = document.getElementById('searchTickerBtn');
const clearTickerBtn = document.getElementById('clearTickerBtn');

if (tickerSearchInput) {
  const debouncedSearch = debounce(searchTicker, 300);
  tickerSearchInput.addEventListener('input', debouncedSearch);
}

if (searchTickerBtn) {
  searchTickerBtn.addEventListener('click', searchTicker);
}

if (clearTickerBtn) {
  clearTickerBtn.addEventListener('click', clearTickerSearch);
}
  
 // CSV Export
  document.getElementById('exportCsvBtn').addEventListener('click', exportTransactionsToCSV);
  // Debounced ticker search
  const debouncedSearch = debounce(searchTicker, 300);
  document.getElementById('tickerSearchInput').addEventListener('input', debouncedSearch);
  
  document.getElementById('searchTickerBtn').addEventListener('click', searchTicker);
  document.getElementById('clearTickerBtn').addEventListener('click', clearTickerSearch);
  document.getElementById('searchTickerBtn').addEventListener('click', searchTicker);
  document.getElementById('clearTickerBtn').addEventListener('click', clearTickerSearch);
  document.getElementById('deleteCashFlowSelected').addEventListener('click', deleteCashFlowSelected);
  document.getElementById('refreshPricesBtn').addEventListener('click', refreshAllPrices);
  
  // Cash flow CSV import
  if (document.getElementById('importCashFlowCsvBtn')) {
    document.getElementById('importCashFlowCsvBtn').addEventListener('click', () => {
      document.getElementById('cashFlowCsvFileInput').click();
    });
  }
  if (document.getElementById('cashFlowCsvFileInput')) {
    document.getElementById('cashFlowCsvFileInput').addEventListener('change', handleCashFlowCsvImport);
  }
  
  // Premium type toggle
  // Type-specific field toggles
document.getElementById('type').addEventListener('change', function() {
  const premiumTypeSelect = document.getElementById('premiumType');
  const dividendTypeSelect = document.getElementById('dividendType');
  const sharesInput = document.getElementById('shares');
  const priceInput = document.getElementById('price');
  
  // Hide all sub-selectors by default
  premiumTypeSelect.style.display = 'none';
  dividendTypeSelect.style.display = 'none';

  // Reset fields and styling
  sharesInput.placeholder = 'Shares/Amount';
  priceInput.placeholder = 'Price';
  sharesInput.disabled = false;
  priceInput.disabled = false;
  sharesInput.style.background = 'white';  // ADD THIS
  sharesInput.style.color = 'black';       // ADD THIS
  priceInput.style.background = 'white';   // ADD THIS
  priceInput.style.color = 'black';        // ADD THIS
  sharesInput.value = '';                  // ADD THIS
  priceInput.value = '';                   // ADD THIS
  
  // Show appropriate sub-selector
  if (this.value === 'premium') {
    premiumTypeSelect.style.display = 'inline-block';
  } else if (this.value === 'dividend') {
    dividendTypeSelect.style.display = 'inline-block';
    handleDividendTypeChange(); // Set initial state
  }
});
}

init();// ============================================
// HYBRID PREMIUMS TABLE - EXPANDABLE ROWS
// ============================================
// Add this to main.js

function updatePremiumsTable(period = 'lifetime') {
  const tbody = document.querySelector('#premiumsTable tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  // Filter transactions by date period
  const now = new Date();
  const filteredTxns = transactions.filter(t => {
    if (t.type !== 'premium') return false;
    
    const txnDate = new Date(t.date);
    
    switch(period) {
      case '1month':
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return txnDate >= oneMonthAgo;
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return txnDate >= quarterAgo;
      case 'ytd':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return txnDate >= yearStart;
      case 'lifetime':
      default:
        return true;
    }
  });
  
  // Group by symbol
  const symbolData = {};
  
  filteredTxns.forEach(t => {
    if (!symbolData[t.symbol]) {
      symbolData[t.symbol] = {
        symbol: t.symbol,
        portfolio: t.portfolio,
        trades: [],
        tradeCount: 0,
        totalPremium: 0,
        coveredCalls: 0,
        cspExpired: 0,
        cspAssigned: 0,
        latestDate: t.date
      };
    }
    
    const data = symbolData[t.symbol];
    data.trades.push(t);
    data.tradeCount++;
    data.totalPremium += t.shares * t.price;
    
    if (t.premium_type === 'covered_call') {
      data.coveredCalls += t.shares * t.price;
    } else if (t.premium_type === 'csp_expired') {
      data.cspExpired += t.shares * t.price;
    } else if (t.premium_type === 'csp_assigned') {
      data.cspAssigned += t.shares * t.price;
    }
    
    if (new Date(t.date) > new Date(data.latestDate)) {
      data.latestDate = t.date;
    }
  });
  
  // Sort by total premium (highest first)
  const sortedData = Object.values(symbolData).sort((a, b) => b.totalPremium - a.totalPremium);
  
  // Populate table with aggregated rows (expandable)
  sortedData.forEach(data => {
    const portfolioObj = portfolios.find(p => p.id === data.portfolio);
    const portfolioName = portfolioObj ? portfolioObj.name : data.portfolio.toUpperCase();
    
    // Main aggregated row (clickable)
    const row = document.createElement('tr');
    row.className = 'premium-summary-row';
    row.dataset.symbol = data.symbol;
    row.style.cursor = 'pointer';
    row.style.backgroundColor = '#f8f9fa';
    
    row.innerHTML = `
      <td>
        <span class="expand-icon" style="margin-right: 8px; font-size: 1.2em;">▶</span>
        <strong style="color: #667eea;">${data.symbol}</strong>
      </td>
      <td>${portfolioName}</td>
      <td><strong>${data.tradeCount}</strong></td>
      <td style="color: #28a745; font-weight: bold;">$${data.totalPremium.toFixed(2)}</td>
      <td>$${data.coveredCalls.toFixed(2)}</td>
      <td>$${data.cspExpired.toFixed(2)}</td>
      <td>$${data.cspAssigned.toFixed(2)}</td>
      <td>${formatDateDDMMYYYY(data.latestDate)}</td>
    `;
    
    tbody.appendChild(row);
    
    // Create detail rows (hidden by default)
    data.trades.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((t, idx) => {
      const detailRow = document.createElement('tr');
      detailRow.className = 'premium-detail-row';
      detailRow.dataset.symbol = data.symbol;
      detailRow.style.display = 'none';
      detailRow.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8f9fa';
      
      const totalPremium = t.shares * t.price;
      
      let premiumTypeDisplay = '';
      let typeColor = '';
      if (t.premium_type === 'covered_call') {
        premiumTypeDisplay = 'Covered Call';
        typeColor = '#667eea';
      } else if (t.premium_type === 'csp_expired') {
        premiumTypeDisplay = 'CSP Expired';
        typeColor = '#28a745';
      } else if (t.premium_type === 'csp_assigned') {
        premiumTypeDisplay = 'CSP Assigned';
        typeColor = '#ffc107';
      }
      
      detailRow.innerHTML = `
        <td colspan="1" style="padding-left: 40px;">
          <input type="checkbox" class="select-row" data-type="${t.type}" data-portfolio="${t.portfolio}" data-symbol="${t.symbol}" data-shares="${t.shares}" data-price="${t.price}" data-date="${t.date}">
        </td>
        <td colspan="2" style="color: ${typeColor}; font-weight: 500;">${premiumTypeDisplay}</td>
        <td>${t.shares.toFixed(2)} shares</td>
        <td>$${t.price.toFixed(2)}/share</td>
        <td colspan="2" style="color: #28a745; font-weight: bold;">$${totalPremium.toFixed(2)}</td>
        <td>${formatDateDDMMYYYY(t.date)}</td>
      `;
      
      tbody.appendChild(detailRow);
    });
    
    // Add click handler to toggle expansion
    row.addEventListener('click', function(e) {
      // Don't toggle if clicking checkbox
      if (e.target.type === 'checkbox') return;
      
      const symbol = this.dataset.symbol;
      const detailRows = tbody.querySelectorAll(`.premium-detail-row[data-symbol="${symbol}"]`);
      const expandIcon = this.querySelector('.expand-icon');
      const isExpanded = detailRows[0].style.display !== 'none';
      
      detailRows.forEach(row => {
        row.style.display = isExpanded ? 'none' : 'table-row';
      });
      
      expandIcon.textContent = isExpanded ? '▶' : '▼';
      this.style.backgroundColor = isExpanded ? '#f8f9fa' : '#e3f2fd';
    });
  });
  
  // Update sidebar with totals
  updatePremiumsSidebar(sortedData);
}

function updatePremiumsSidebar(premiumData) {
  const sidebar = document.getElementById('premiumsSidebar');
  if (!sidebar) return;
  
  let totalPremium = 0;
  let totalTrades = 0;
  let totalCoveredCalls = 0;
  let totalCspExpired = 0;
  let totalCspAssigned = 0;
  
  premiumData.forEach(data => {
    totalPremium += data.totalPremium;
    totalTrades += data.tradeCount;
    totalCoveredCalls += data.coveredCalls;
    totalCspExpired += data.cspExpired;
    totalCspAssigned += data.cspAssigned;
  });
  
  sidebar.innerHTML = `
    <h3 style="margin-top: 0; color: #667eea;">💰 Premium Summary</h3>
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 8px; color: white; margin-bottom: 16px;">
      <div style="font-size: 0.9em; opacity: 0.9;">Total Premium Income</div>
      <div style="font-size: 1.8em; font-weight: bold; margin-top: 4px;">$${totalPremium.toFixed(2)}</div>
      <div style="font-size: 0.85em; opacity: 0.8; margin-top: 4px;">${totalTrades} trades</div>
    </div>
    
    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #666;">Covered Calls:</span>
        <strong style="color: #667eea;">$${totalCoveredCalls.toFixed(2)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #666;">CSP Expired:</span>
        <strong style="color: #28a745;">$${totalCspExpired.toFixed(2)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #666;">CSP Assigned:</span>
        <strong style="color: #ffc107;">$${totalCspAssigned.toFixed(2)}</strong>
      </div>
    </div>
    
    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
      <div style="font-size: 0.9em; color: #666; margin-bottom: 8px;">💡 Top Premium Earners</div>
      ${premiumData.slice(0, 5).map(data => `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e0e0e0;">
          <span style="font-weight: 500; color: #667eea;">${data.symbol}</span>
          <span style="color: #28a745; font-weight: bold;">$${data.totalPremium.toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
    
    <div style="font-size: 0.85em; color: #888; padding: 8px; background: #fff3cd; border-radius: 6px; border-left: 3px solid #ffc107;">
      <strong>💡 Tip:</strong> Click any ticker to expand and see individual trades!
    </div>
  `;
}
