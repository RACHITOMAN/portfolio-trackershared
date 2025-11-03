function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
function makeTickerClickable(symbol) {
  return `<span class="clickable-ticker" onclick="filterByTicker('${symbol}')" style="cursor: pointer; color: #007BFF; text-decoration: underline; font-weight: bold;" title="Click to view all ${symbol} transactions">${symbol}</span>`;
}
function filterByTicker(symbol) {
  activeTickerFilter = symbol;
  showTickerModal(symbol);
}
function showTickerModal(symbol) {
  const symbolTransactions = transactions.filter(t => t.symbol === symbol);
  
  if (symbolTransactions.length === 0) {
    alert('No transactions found for ' + symbol);
    return;
  }
  
  // Calculate shares manually to ENSURE premiums are excluded
  let totalSharesBought = 0;
  let totalSharesSold = 0;
  let totalPremiumIncome = 0; // Net premium (STO - BTC)
  let totalPremiumSTO = 0; // Income from selling options
  let totalPremiumBTC = 0; // Cost of buying back options
  let totalDividendIncome = 0;
  let netInvestmentAmount = 0;
  
  symbolTransactions.forEach(t => {
    if (t.type === 'buy') {
      totalSharesBought += t.shares;
      netInvestmentAmount += (t.shares * t.price);
    } else if (t.type === 'sell') {
      totalSharesSold += t.shares;
      netInvestmentAmount -= (t.shares * t.price);
    } else if (t.type === 'dividend' && t.shares > 0) {
      // DRIP dividends add shares
      totalSharesBought += t.shares;
      netInvestmentAmount += (t.shares * t.price);
    } else if (t.type === 'dividend' && t.shares === 0) {
      // Cash dividends (income)
      totalDividendIncome += t.price;
    } else if (t.type === 'premium') {
      const premiumAmount = Math.abs(t.shares) * Math.abs(t.price);
      // Check if price is negative (loss) or positive (income)
      if (t.price >= 0) {
        // Positive price = Income from selling options
        totalPremiumSTO += premiumAmount;
        totalPremiumIncome += premiumAmount;
      } else {
        // Negative price = Loss from buying back options
        totalPremiumBTC += premiumAmount;
        totalPremiumIncome -= premiumAmount;
      }
    }
  });
  
  const totalShares = totalSharesBought - totalSharesSold;
  const effectiveInvestment = netInvestmentAmount - totalPremiumIncome - totalDividendIncome;
  
  // Debug logging
  console.log(`${symbol} Modal Calculations:`);
  console.log(`Premium STO (Income): $${totalPremiumSTO.toFixed(2)}`);
  console.log(`Premium BTC (Cost): $${totalPremiumBTC.toFixed(2)}`);
  console.log(`Net Premium Income: $${totalPremiumIncome.toFixed(2)}`);
  console.log(`Total Dividend Income: $${totalDividendIncome.toFixed(2)}`);
  console.log(`Net Investment: $${netInvestmentAmount.toFixed(2)}`);
  console.log(`Effective Investment: $${effectiveInvestment.toFixed(2)}`);
  
  // Get other pre-calculated data from globalSymbolData
  const holdingData = globalSymbolData[symbol] || {};
  
  const avgCost = holdingData.avgCost || 0;
  const currentPrice = getCurrentPrice(symbol) || 0;
  const totalCost = holdingData.totalCost || 0;
  const currentValue = holdingData.currentValue || 0;
  const gainLoss = holdingData.gainLoss || 0;
  const gainLossPercent = parseFloat(holdingData.gainLossPercent) || 0;
  const xirrValue = ((holdingData.xirr || 0) * 100);
  const weightedDays = holdingData.weightedDays || 0;
  
  // Get first and last dates
  let firstDate = null;
  let lastDate = null;
  symbolTransactions.forEach(t => {
    const transDate = new Date(t.date);
    if (!firstDate || transDate < firstDate) firstDate = transDate;
    if (!lastDate || transDate > lastDate) lastDate = transDate;
  });
  
  const modalHTML = `
    <div id="tickerModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; border-radius: 10px; padding: 20px; max-width: 90%; max-height: 90%; overflow: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
          <h2 style="margin: 0; color: #667eea; text-align: center;">${symbol} - Transaction Details</h2>
          <button onclick="closeTickerModal()" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">✕ Close</button>
        </div>
        
        <!-- Summary Stats -->
        <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 8px; padding: 15px; margin-bottom: 20px; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 1.05em;">📊 Summary</h3>
          
          <div style="display: grid; grid-template-columns: repeat(11, 1fr); gap: 8px;">
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">Total Shares</div>
              <div style="font-size: 1em; font-weight: 600; color: #2c3e50; text-align: center;">${totalShares.toFixed(2)}</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">Avg Cost</div>
              <div style="font-size: 1em; font-weight: 600; color: #2c3e50; text-align: center;">$${avgCost.toFixed(2)}</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">Current Price</div>
              <div style="font-size: 1em; font-weight: 600; color: #667eea; text-align: center;">$${currentPrice.toFixed(2)}</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">Cost Basis</div>
              <div style="font-size: 1em; font-weight: 600; color: #2c3e50; text-align: center;">$${totalCost.toFixed(2)}</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">Current Value</div>
              <div style="font-size: 1em; font-weight: 600; color: #2c3e50; text-align: center;">$${currentValue.toFixed(2)}</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">Gain/Loss</div>
              <div style="font-size: 1em; font-weight: 600; color: ${gainLoss >= 0 ? '#28a745' : '#dc3545'};">$${gainLoss.toFixed(2)}</div>
              <div style="font-size: 0.8em; font-weight: 600; color: ${gainLoss >= 0 ? '#28a745' : '#dc3545'};">(${gainLossPercent.toFixed(2)}%)</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">XIRR</div>
              <div style="font-size: 1em; font-weight: 600; color: #667eea; text-align: center;">${weightedDays < 90 ? 'N/A' : xirrValue.toFixed(2) + '%'}</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">Days Held</div>
              <div style="font-size: 1em; font-weight: 600; color: #2c3e50; text-align: center;">${Math.round(weightedDays)}</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">First Buy</div>
              <div style="font-size: 1em; font-weight: 600; color: #2c3e50; text-align: center;">${firstDate ? formatDateDDMMYYYY(firstDate) : 'N/A'}</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">Last Entry</div>
              <div style="font-size: 1em; font-weight: 600; color: #2c3e50; text-align: center;">${lastDate ? formatDateDDMMYYYY(lastDate) : 'N/A'}</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #6c757d; font-size: 0.75em; margin-bottom: 3px; white-space: nowrap; text-align: center;">Transactions</div>
              <div style="font-size: 1em; font-weight: 600; color: #667eea; text-align: center;">${symbolTransactions.length}</div>
            </div>
          </div>
        </div>
        
        <!-- Transaction Table -->
        <h3 style="margin: 20px 0 10px 0; color: #2c3e50; text-align: center;">📝 All Transactions</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Date</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Type</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Portfolio</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Shares</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Price</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${symbolTransactions.map(t => {
              // Find the original index in the full transactions array
              const originalIndex = transactions.indexOf(t);
              return `
              <tr style="border-bottom: 1px solid #dee2e6; cursor: pointer;" ondblclick="editTransactionFromModal(${originalIndex})" title="Double-click to edit">
                <td style="padding: 10px; text-align: center;">${formatDateDDMMYYYY(t.date)}</td>
                <td style="padding: 10px; text-align: center;"><span style="background: ${t.type === 'buy' ? '#28a745' : t.type === 'sell' ? '#dc3545' : '#ffc107'}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">${t.type.toUpperCase()}</span></td>
                <td style="padding: 10px; text-align: center;">${portfolios.find(p => p.id === t.portfolio)?.name || t.portfolio}</td>
                <td style="padding: 10px; text-align: center;">${Math.abs(t.shares).toFixed(2)}</td>
                <td style="padding: 10px; text-align: center;">$${t.price.toFixed(2)}</td>
<td style="padding: 10px; text-align: center; font-weight: bold; color: ${
  t.type === 'dividend' && t.shares === 0 ? '#28a745' : 
  t.type === 'premium' && t.price >= 0 ? '#28a745' :
  t.type === 'premium' && t.price < 0 ? '#dc3545' :
  'inherit'
};">
  ${t.type === 'dividend' && t.shares === 0 ? '-$' + t.price.toFixed(2) : 
    t.type === 'premium' && t.price >= 0 ? '-$' + (Math.abs(t.shares) * t.price).toFixed(2) :
    t.type === 'premium' && t.price < 0 ? '+$' + (Math.abs(t.shares) * Math.abs(t.price)).toFixed(2) :
    '$' + (Math.abs(t.shares) * t.price).toFixed(2)}
</td>        
   </tr>
`;
            }).join('')}
          </tbody>
<tfoot>
  <tr style="background: #f0f8ff; border-top: 2px solid #667eea;">
    <td colspan="3" style="padding: 10px; text-align: right; font-weight: 600; color: #2c3e50;">Net Investment (Shares):</td>
    <td style="padding: 10px; text-align: center; font-weight: 600;">${totalShares.toFixed(2)}</td>
    <td style="padding: 10px;"></td>
    <td style="padding: 10px; text-align: center; color: #2c3e50; font-weight: 600;">$${netInvestmentAmount.toFixed(2)}</td>
  </tr>
  ${totalPremiumIncome !== 0 ? `
  <tr style="background: #fffef0;">
    <td colspan="3" style="padding: 10px; text-align: right; font-weight: 600; color: #856404;">Option Premium ${totalPremiumIncome > 0 ? 'Generated' : 'Loss'}:</td>
    <td style="padding: 10px; text-align: center;"></td>
    <td style="padding: 10px;"></td>
    <td style="padding: 10px; text-align: center; color: ${totalPremiumIncome > 0 ? '#28a745' : '#dc3545'}; font-weight: bold;">${totalPremiumIncome > 0 ? '-' : '+'}$${Math.abs(totalPremiumIncome).toFixed(2)}</td>
  </tr>
  ` : ''}
  ${totalDividendIncome > 0 ? `
  <tr style="background: #fff5f5;">
    <td colspan="3" style="padding: 10px; text-align: right; font-weight: 600; color: #c53030;">Dividends Received:</td>
    <td style="padding: 10px; text-align: center;"></td>
    <td style="padding: 10px;"></td>
    <td style="padding: 10px; text-align: center; color: #28a745; font-weight: bold;">-$${totalDividendIncome.toFixed(2)}</td>
  </tr>
  ` : ''}
  <tr style="background: #e8f5e9; font-weight: bold; border-top: 3px solid #28a745;">
    <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; color: #155724;">Effective Investment:</td>
    <td style="padding: 12px; text-align: center; font-weight: bold;">${totalShares.toFixed(2)}</td>
    <td style="padding: 12px;"></td>
    <td style="padding: 12px; text-align: center; color: #155724; font-weight: bold;">$${effectiveInvestment.toFixed(2)}</td>
  </tr>
</tfoot>
        </table>
        <p style="margin-top: 15px; color: #6c757d; font-size: 0.9em; text-align: center;">💡 Tip: Double-click any transaction to edit it</p>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}
function closeTickerModal() {
  const modal = document.getElementById('tickerModal');
  if (modal) {
    modal.remove();
  }
  activeTickerFilter = null;
}
function editTransactionFromModal(transactionIndex) {
  // Close the modal first
  closeTickerModal();
  
  // Check if transaction exists
  if (transactionIndex === -1 || !transactions[transactionIndex]) {
    alert('Transaction not found');
    return;
  }
  
  // Open edit modal directly
  showEditModal(transactionIndex);
}
function getPortfolioColor(portfolioId) {
  const colors = {
    'portfolio-1': '#007bff',
    'portfolio-2': '#28a745', 
    'portfolio-3': '#ffc107',
    'portfolio-4': '#dc3545',
    'portfolio-5': '#6f42c1'
  };
  return colors[portfolioId] || '#6c757d';
}

function createAndUpdateSoldSidebar() {
  const soldSidebar = document.getElementById('soldSidebar');
  if (!soldSidebar) return;
  
  // Create soldData from transactions
  const soldData = {};
  
  // Group transactions by symbol
  const transactionsBySymbol = {};
  transactions.forEach(t => {
    if (!transactionsBySymbol[t.symbol]) {
      transactionsBySymbol[t.symbol] = [];
    }
    transactionsBySymbol[t.symbol].push(t);
  });
  
  // Calculate sold positions
  Object.entries(transactionsBySymbol).forEach(([symbol, txns]) => {
    let totalBuys = 0;
    let totalSells = 0;
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let portfolio = null;
    let firstBuyDate = null;
    let lastSellDate = null;
    
    txns.forEach(t => {
      if (t.type === 'buy') {
        totalBuys += t.shares;
        totalBuyAmount += t.shares * t.price;
        portfolio = t.portfolio;
        if (!firstBuyDate || new Date(t.date) < new Date(firstBuyDate)) {
          firstBuyDate = t.date;
        }
      } else if (t.type === 'sell') {
        totalSells += t.shares;
        totalSellAmount += t.shares * t.price;
        if (!lastSellDate || new Date(t.date) > new Date(lastSellDate)) {
          lastSellDate = t.date;
        }
      }
    });
    
    // Only include if fully sold (sells >= buys)
    if (totalSells > 0 && totalSells >= totalBuys) {
      const avgBuyPrice = totalBuys > 0 ? totalBuyAmount / totalBuys : 0;
      const avgSellPrice = totalSells > 0 ? totalSellAmount / totalSells : 0;
      const realizedGain = totalSellAmount - totalBuyAmount;
      
      soldData[symbol] = {
        symbol: symbol,
        portfolio: portfolio,
        sharesSold: totalSells,
        avgBuyPrice: avgBuyPrice,
        avgSellPrice: avgSellPrice,
        totalCost: totalBuyAmount,
        totalProceeds: totalSellAmount,
        realizedGain: realizedGain,
        gainPercent: totalBuyAmount > 0 ? ((realizedGain / totalBuyAmount) * 100).toFixed(2) : '0.00',
        firstBuy: firstBuyDate,
        lastSell: lastSellDate
      };
    }
  });
  
  // Calculate sidebar data
  let totalRealizedGain = 0;
  let totalUnrealizedGain = 0;
  
  const portfolioBreakdown = {};
  portfolios.filter(p => p.id !== 'total').forEach(p => {
    portfolioBreakdown[p.id] = {
      name: p.name,
      realizedGain: 0,
      unrealizedGain: 0,
      soldCount: 0
    };
  });
  
  // Add realized gains from sold positions
  Object.values(soldData).forEach(position => {
    totalRealizedGain += position.realizedGain;
    if (portfolioBreakdown[position.portfolio]) {
      portfolioBreakdown[position.portfolio].realizedGain += position.realizedGain;
      portfolioBreakdown[position.portfolio].soldCount += 1;
    }
  });
  
  // Add unrealized gains from current holdings
  Object.values(globalSymbolData || {}).forEach(position => {
    if (position.netShares > 0) {
      const unrealizedGain = position.gainLoss || 0;
      totalUnrealizedGain += unrealizedGain;
      if (portfolioBreakdown[position.portfolio]) {
        portfolioBreakdown[position.portfolio].unrealizedGain += unrealizedGain;
      }
    }
  });
  
  const combinedTotal = totalRealizedGain + totalUnrealizedGain;
  
  // Build sidebar HTML
  const sidebarHTML = `
    <div style="padding: 12px; overflow-y: auto; max-height: 100vh; font-size: 13px;">
      <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 16px;">💰 Gains Summary</h3>
      
      <!-- Total Realized Gains -->
      <div class="summary-card" style="margin-bottom: 8px; background: #f8f9fa; padding: 10px; border-radius: 6px; border: 1px solid #dee2e6;">
        <div style="font-weight: bold; color: #6c757d; font-size: 11px; margin-bottom: 4px;">Total Realized Gain</div>
        <div style="color: ${totalRealizedGain >= 0 ? '#28a745' : '#dc3545'}; font-weight: bold; font-size: 14px; word-break: break-all;">
          $${Math.round(totalRealizedGain).toLocaleString()}
        </div>
        <div style="font-size: 10px; color: #6c757d; margin-top: 2px;">From ${Object.keys(soldData).length} sold positions</div>
      </div>
      
      <!-- Total Unrealized Gains -->
      <div class="summary-card" style="margin-bottom: 8px; background: #f8f9fa; padding: 10px; border-radius: 6px; border: 1px solid #dee2e6;">
        <div style="font-weight: bold; color: #6c757d; font-size: 11px; margin-bottom: 4px;">Total Unrealized Gain</div>
        <div style="color: ${totalUnrealizedGain >= 0 ? '#28a745' : '#dc3545'}; font-weight: bold; font-size: 14px; word-break: break-all;">
          $${Math.round(totalUnrealizedGain).toLocaleString()}
        </div>
        <div style="font-size: 10px; color: #6c757d; margin-top: 2px;">From current holdings</div>
      </div>
      
      <!-- Combined Total -->
      <div class="summary-card" style="margin-bottom: 15px; background: #f8f9fa; padding: 10px; border-radius: 6px; border: 2px solid ${combinedTotal >= 0 ? '#28a745' : '#dc3545'};">
        <div style="font-weight: bold; color: #2c3e50; font-size: 11px; margin-bottom: 4px;">Combined Total</div>
        <div style="color: ${combinedTotal >= 0 ? '#28a745' : '#dc3545'}; font-weight: bold; font-size: 15px; word-break: break-all;">
          $${Math.round(combinedTotal).toLocaleString()}
        </div>
        <div style="font-size: 10px; color: #6c757d; margin-top: 2px;">Realized + Unrealized</div>
      </div>
      
      <!-- Portfolio Breakdown -->
      <h4 style="margin: 15px 0 8px 0; color: #2c3e50; border-bottom: 1px solid #dee2e6; padding-bottom: 4px; font-size: 13px;">By Portfolio</h4>
      
      ${Object.entries(portfolioBreakdown).map(([portfolioId, data]) => {
        const totalForPortfolio = data.realizedGain + data.unrealizedGain;
        const portfolioColor = getPortfolioColor(portfolioId);
        
        return `
          <div class="summary-card" style="margin-bottom: 6px; background: #f8f9fa; padding: 8px; border-radius: 6px; border: 1px solid #dee2e6;">
            <div style="font-weight: bold; color: #6c757d; font-size: 10px; margin-bottom: 3px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${portfolioColor}; margin-right: 4px;"></span>
              ${data.name}
            </div>
            <div style="color: ${totalForPortfolio >= 0 ? '#28a745' : '#dc3545'}; font-weight: bold; font-size: 12px; margin-bottom: 3px; word-break: break-all;">
              $${Math.round(totalForPortfolio).toLocaleString()}
            </div>
            <div style="font-size: 9px; color: #6c757d; line-height: 1.2;">
              R: <span style="color: ${data.realizedGain >= 0 ? '#28a745' : '#dc3545'}">$${Math.round(data.realizedGain).toLocaleString()}</span><br>
              U: <span style="color: ${data.unrealizedGain >= 0 ? '#28a745' : '#dc3545'}">$${Math.round(data.unrealizedGain).toLocaleString()}</span><br>
              ${data.soldCount} sold
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  soldSidebar.innerHTML = sidebarHTML;
}

function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      if (tab.id === 'importCsvBtn' || tab.id === 'refreshPricesBtn') {
        return;
      }
      
      tabs.forEach(function(t) {
        t.classList.remove('active');
      });
      tabContents.forEach(function(tc) {
        tc.classList.remove('active');
      });
      tab.classList.add('active');
      const content = document.getElementById(tab.dataset.tab);
      if (content) content.classList.add('active');
      
      const mainControls = document.querySelectorAll('.controls')[0];
      
      if (mainControls) {
        mainControls.querySelectorAll('select, input, button').forEach(el => el.style.display = '');
        
        const portfolioTabs = ['total', ...portfolios.filter(p => p.id !== 'total').map(p => p.id)];
        const tabsWithDelete = ['total', ...portfolios.filter(p => p.id !== 'total').map(p => p.id), 'all', 'ticker', 'sold'];

        if (portfolioTabs.includes(tab.dataset.tab)) {
          mainControls.style.display = 'flex';
          mainControls.querySelectorAll('select, input, button').forEach(el => el.style.display = '');
        } else if (tabsWithDelete.includes(tab.dataset.tab)) {
          mainControls.style.display = 'flex';
          mainControls.querySelectorAll('select, input:not([type="checkbox"]), #addTransactionBtn, #clearDataBtn').forEach(el => el.style.display = 'none');
          const deleteBtn = document.getElementById('deleteSelected');
          if (deleteBtn) deleteBtn.style.display = 'inline-block';
        } else {
          mainControls.style.display = 'none';
        }
      }
      
      if (tab.dataset.tab === 'ticker') {
        console.log('Ticker tab clicked - showing delete button');
        const deleteBtn = document.getElementById('deleteSelected');
        console.log('Delete button:', deleteBtn);
        if (deleteBtn) {
          deleteBtn.style.display = 'inline-block';
          console.log('Delete button display:', deleteBtn.style.display);
        }
      }
      
      // Sidebar management
      const portfolioSidebar = document.getElementById('portfolioSidebar');
      const dividendsSidebar = document.getElementById('dividendsSidebar');
      const premiumsSidebar = document.getElementById('premiumsSidebar');
      const cashFlowSidebar = document.getElementById('cashFlowSidebar');
      const soldSidebar = document.getElementById('soldSidebar');
      const sidebarContainer = document.querySelector('.sidebar');

      // Hide all sidebars first
      [portfolioSidebar, dividendsSidebar, premiumsSidebar, cashFlowSidebar, soldSidebar].forEach(sb => {
        if (sb) sb.style.display = 'none';
      });
      
      // Determine which sidebar to show
      const portfolioTabsList = ['total', ...portfolios.filter(p => p.id !== 'total').map(p => p.id)];
      
      if (portfolioTabsList.includes(tab.dataset.tab)) {
        // Portfolio tabs use portfolio sidebar
        if (portfolioSidebar) portfolioSidebar.style.display = 'block';
        
      } else if (tab.dataset.tab === 'dividends') {
        if (dividendsSidebar) dividendsSidebar.style.display = 'block';
        updateDividendsTable('total');
        updateDividendsSidebar();
        
      } else if (tab.dataset.tab === 'premiums') {
        if (premiumsSidebar) premiumsSidebar.style.display = 'block';
        updatePremiumsTable('lifetime');
        
      } else if (tab.dataset.tab === 'cashflow') {
        if (cashFlowSidebar) cashFlowSidebar.style.display = 'block';
        
      } else if (tab.dataset.tab === 'sold') {
        if (soldSidebar) {
          soldSidebar.style.display = 'block';
          // Create soldData and update sidebar
          createAndUpdateSoldSidebar();
        }
        
      } else if (tab.dataset.tab === 'all') {
        updateAllTransactionsTable();
        populatePortfolioFilter();
      }
      // 'ticker' and 'all' tabs show no sidebar
      
      // Hide entire sidebar container for tabs that don't need it
      if (tab.dataset.tab === 'ticker' || tab.dataset.tab === 'all') {
        if (sidebarContainer) sidebarContainer.style.display = 'none';
      } else {
        if (sidebarContainer) sidebarContainer.style.display = 'block';
      }
      refreshPricesAndNames();
    });  // Close tab.addEventListener
  });  // Close tabs.forEach
}  // Close initializeTabs function

function convertToDateInputFormat(dateValue) {
  if (!dateValue) return '';
  
  let dateObj;
  
  // Handle DD/MM/YYYY format
  if (typeof dateValue === 'string' && dateValue.includes('/')) {
    const parts = dateValue.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`; // Return yyyy-MM-dd
    }
  }
  
  // Handle ISO format (2023-05-22T00:00:00+00:00)
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    dateObj = new Date(dateValue);
  }
  // Handle Date object
  else if (dateValue instanceof Date) {
    dateObj = dateValue;
  }
  // Try generic parsing
  else {
    dateObj = new Date(dateValue);
  }
  
  // Return yyyy-MM-dd format
  if (dateObj && !isNaN(dateObj.getTime())) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return '';
}
function showEditModal(transactionIndex) {
  console.log('🔍 Opening edit for index:', transactionIndex);
  console.log('🔍 Transaction:', transactions[transactionIndex]);
  
  const t = transactions[transactionIndex];
  if (!t) {
    console.error('Transaction not found at index:', transactionIndex);
    return;
  }
  
  // Premium type dropdown (only shown if type is premium)
  const premiumTypeField = t.type === 'premium' ? `
    <div id="editPremiumTypeContainer">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Premium Type:</label>
      <select id="editPremiumType" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
        <option value="covered_call" ${(t.premiumType || t.premium_type) === 'covered_call' ? 'selected' : ''}>Covered Call</option>
        <option value="csp_expired" ${(t.premiumType || t.premium_type) === 'csp_expired' ? 'selected' : ''}>CSP Expired</option>
        <option value="csp_assigned" ${(t.premiumType || t.premium_type) === 'csp_assigned' ? 'selected' : ''}>CSP Assigned</option>
      </select>
    </div>
  ` : '';
  
  const modalHTML = `
    <div id="editModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; border-radius: 10px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #007BFF; padding-bottom: 10px;">
          <h2 style="margin: 0; color: #007BFF;">Edit Transaction</h2>
          <button onclick="closeEditModal()" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">✕</button>
        </div>
        <form id="editForm" style="display: flex; flex-direction: column; gap: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Type:</label>
            <select id="editType" onchange="toggleEditPremiumType()" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
              <option value="buy" ${t.type === 'buy' ? 'selected' : ''}>Buy</option>
              <option value="sell" ${t.type === 'sell' ? 'selected' : ''}>Sell</option>
              <option value="dividend" ${t.type === 'dividend' ? 'selected' : ''}>Dividend</option>
              <option value="premium" ${t.type === 'premium' ? 'selected' : ''}>Premium</option>
            </select>
          </div>
          ${premiumTypeField}
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Portfolio:</label>
            <select id="editPortfolio" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
              ${portfolios.filter(p => p.id !== 'total').map(p => `<option value="${p.id}" ${t.portfolio === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Symbol:</label>
            <input type="text" id="editSymbol" value="${t.symbol}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; text-transform: uppercase;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Shares:</label>
            <input type="number" id="editShares" value="${Math.abs(t.shares)}" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Price:</label>
            <input type="number" id="editPrice" value="${t.price}" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Date:</label>
            <input type="date" id="editDate" value="${convertToDateInputFormat(t.date)}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" onclick="saveEditedTransaction(${transactionIndex})" style="flex: 1; background: #28a745; color: white; border: none; padding: 12px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px;">💾 Save Changes</button>
            <button type="button" onclick="closeEditModal()" style="flex: 1; background: #6c757d; color: white; border: none; padding: 12px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px;">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Toggle premium type dropdown when type changes
function toggleEditPremiumType() {
  const typeSelect = document.getElementById('editType');
  const container = document.getElementById('editPremiumTypeContainer');
  
  if (typeSelect.value === 'premium' && !container) {
    // Add premium type dropdown
    const premiumHTML = `
      <div id="editPremiumTypeContainer">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Premium Type:</label>
        <select id="editPremiumType" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
          <option value="covered_call">Covered Call</option>
          <option value="csp_expired">CSP Expired</option>
          <option value="csp_assigned">CSP Assigned</option>
        </select>
      </div>
    `;
    typeSelect.closest('div').insertAdjacentHTML('afterend', premiumHTML);
  } else if (typeSelect.value !== 'premium' && container) {
    // Remove premium type dropdown
    container.remove();
  }
}
function closeEditModal() {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.remove();
  }
}
function formatDateInput(input) {
  let value = input.value.replace(/\D/g, ''); // Remove non-digits
  
  if (value.length >= 2) {
    value = value.slice(0, 2) + '/' + value.slice(2);
  }
  if (value.length >= 5) {
    value = value.slice(0, 5) + '/' + value.slice(5, 9);
  }
  
  input.value = value;
  
  // Validate complete date
  if (value.length === 10) {
    const parts = value.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      input.style.borderColor = 'red';
    } else {
      input.style.borderColor = '#ddd';
    }
  }
}
function applyTransactionFilters() {
  transactionFilters.type = document.getElementById('filterType').value;
  transactionFilters.portfolio = document.getElementById('filterPortfolio').value;
  transactionFilters.symbol = document.getElementById('filterSymbol').value;
  
  refreshPricesAndNames();
}

function clearTransactionFilters() {
  transactionFilters = {
    type: '',
    portfolio: '',
    symbol: ''
  };
  
  document.getElementById('filterType').value = '';
  document.getElementById('filterPortfolio').value = '';
  document.getElementById('filterSymbol').value = '';
  
  refreshPricesAndNames();
}
// ============ SORT LISTENERS ============

function initializeSortListeners() {
  const tables = {
    total: document.getElementById('totalTable'),
    sold: document.getElementById('soldTable'),
    ticker: document.getElementById('tickerTable'),
    all: document.getElementById('allTable')
  };
  
  // Add custom portfolio tables
  portfolios.filter(p => p.id !== 'total').forEach(p => {
    tables[p.id] = document.getElementById(p.id + 'Table');
  });
  
  for (const portfolio in tables) {
    const table = tables[portfolio];
    if (!table) continue;
    
    // Skip if already initialized
    if (table.dataset.sortInitialized === 'true') continue;
    table.dataset.sortInitialized = 'true';
    
    const headers = table.querySelectorAll('th');
    headers.forEach(function(header) {
      // Skip if no sort attribute or is select column
      const column = header.dataset.sort;
      if (!column || column === 'select') return;
      
      header.style.cursor = 'pointer';
      
      header.addEventListener('click', function handleSort() {
        // Initialize sort state if needed
        if (!sortState[portfolio]) {
          sortState[portfolio] = { column: column, direction: 'asc' };
        }
        
        // Determine new direction
        let newDirection;
        if (sortState[portfolio].column === column) {
          // Same column - toggle direction
          newDirection = sortState[portfolio].direction === 'asc' ? 'desc' : 'asc';
        } else {
          // Different column - start with asc
          newDirection = 'asc';
        }
        
        // Update state
        sortState[portfolio] = { column: column, direction: newDirection };
        
        // Remove all sort indicators
        headers.forEach(function(h) {
          h.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add indicator to clicked header
        this.classList.add('sort-' + newDirection);
        
        // Perform sort
        sortTable(table, column, newDirection);
        
        console.log('Sorted', portfolio, 'by', column, newDirection);
      });
    });
  }
}

function sortTable(table, column, direction) {
  if (!table || !(table instanceof HTMLTableElement)) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const headers = Array.from(table.querySelectorAll('th'));
  const columnIndex = headers.findIndex(function(th) {
    return th.dataset.sort === column;
  });
  
  if (columnIndex === -1) return;
  
  rows.sort(function(a, b) {
    if (!a.cells[columnIndex] || !b.cells[columnIndex]) return 0;
    
    let aValue = a.cells[columnIndex].textContent.trim();
    let bValue = b.cells[columnIndex].textContent.trim();
    
    // Remove currency symbols, percentage signs, etc.
    aValue = aValue.replace(/\$/g, '').replace(/%/g, '').replace(/ days/g, '').trim();
    bValue = bValue.replace(/\$/g, '').replace(/%/g, '').replace(/ days/g, '').trim();
    
    // Handle "N/A" values
    if (aValue === 'N/A' || aValue === 'Invalid Date') aValue = direction === 'asc' ? 'zzz' : '';
    if (bValue === 'N/A' || bValue === 'Invalid Date') bValue = direction === 'asc' ? 'zzz' : '';
    
    // Check if values are dates in DD/MM/YYYY format
    if (aValue.match(/^\d{2}\/\d{2}\/\d{4}$/) && bValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const aParts = aValue.split('/');
      const bParts = bValue.split('/');
      aValue = new Date(aParts[2], aParts[1] - 1, aParts[0]).getTime();
      bValue = new Date(bParts[2], bParts[1] - 1, bParts[0]).getTime();
    }
    // Check if values are numbers
    else if (!isNaN(aValue) && !isNaN(bValue) && aValue !== '' && bValue !== '') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    
    // Compare values
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Clear tbody and append sorted rows
  tbody.innerHTML = '';
  rows.forEach(function(row) {
    tbody.appendChild(row);
  });
}

// ============ TRANSACTIONS ============
function convertDDMMYYYYtoYYYYMMDD(dateStr) {
  // If already in YYYY-MM-DD format, return as is
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  return dateStr;
}
function updateCsvHelpModal() {
  const portfolioNamesList = document.getElementById('portfolioNamesList');
  const portfolioExamples = document.getElementById('portfolioExamples');
  
  if (!portfolioNamesList) return;
  
  const names = portfolios
    .filter(p => p.id !== 'total')
    .map(p => p.name);
  
  if (names.length > 0) {
    portfolioNamesList.textContent = names.join(', ');
    portfolioExamples.textContent = names.join(', ');
  } else {
    portfolioNamesList.innerHTML = '<em style="color: #dc3545;">No portfolios created yet. Go to Settings → Add Portfolio first!</em>';
    portfolioExamples.textContent = 'Create portfolios in Settings first';
  }
}

// Call this when opening the help modal
document.getElementById('csvHelpBtn').addEventListener('click', function() {
  updateCsvHelpModal();
  document.getElementById('csvHelpModal').classList.add('active');
});
// ============ EVENT LISTENERS & INITIALIZATION ============
  // Generate price cell with checkbox for manual editing
function generatePriceCell(symbol, currentPrice) {
  const price = getCurrentPrice(symbol) || currentPrice || 0;
  
  if (priceMode === 'manual') {
    return `
      <div class="price-cell">
        <span>$${price.toFixed(2)}</span>
        <input type="checkbox" class="price-edit-checkbox" data-symbol="${symbol}" onchange="handlePriceCheckbox(this, '${symbol}', ${price})">
      </div>
    `;
  } else {
    return `$${price.toFixed(2)}`;
  }
}
async function saveEditedTransaction(transactionIndex) {
  const type = document.getElementById('editType').value;
  const portfolio = document.getElementById('editPortfolio').value;
  const symbol = document.getElementById('editSymbol').value.trim().toUpperCase();
  const shares = parseFloat(document.getElementById('editShares').value);
  const price = parseFloat(document.getElementById('editPrice').value);
  const date = document.getElementById('editDate').value;
  
  if (!symbol || isNaN(shares) || isNaN(price) || !date) {
    alert('Please fill in all required fields');
    return;
  }
  
  const updatedTransaction = {
    type,
    portfolio,
    symbol,
    shares: type === 'sell' ? -Math.abs(shares) : Math.abs(shares),
    price,
    date: date + 'T00:00:00Z'
  };
  
  // Add premium type if it's a premium transaction
  if (type === 'premium') {
    const premiumTypeField = document.getElementById('editPremiumType');
    if (premiumTypeField) {
      updatedTransaction.premiumType = premiumTypeField.value;
    }
  }
  
  transactions[transactionIndex] = updatedTransaction;
  
  await saveDataToLocalStorage();
  refreshPricesAndNames();
  closeEditModal();
  alert('Transaction updated successfully!');
}
