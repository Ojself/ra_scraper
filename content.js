
(() => {
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4,
    Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9,
    Nov: 10, Dec: 11,
  };

  function scrapeEventData() {
    const eventName = document.querySelector('[data-pw-test-id="event-header"] h1')?.innerText.trim();
    const venue = document.querySelector('[data-pw-test-id="event-venue-link"]')?.innerText.trim();
    const eventUrl = window.location.href;
    const description = document
      .querySelector('.EventDescription__BreakText-a2vzlh-0')
      ?.innerText.trim();

    const startDateElement = document.querySelector('li[area="date"] a span');
    const startDateText = startDateElement ? startDateElement.innerText.trim() : null;

    const timeElement = document.querySelector('li[area="date"] div[pt="1"]');
    const timeText = timeElement ? timeElement.innerText.trim() : null;

    let startDate = null;
    if (startDateText && timeText) {
      try {
        // startDateText example: "2 Jun 2025"
        const [, day, monthName, year] = startDateText.match(/(\d+)\s(\w+)\s(\d{4})/);
        // timeText example: "22:00 - 06:00"
        const startTime = timeText.split(' - ')[0];

        const date = new Date(
          Date.UTC(
            parseInt(year, 10),
            monthMap[monthName],
            parseInt(day, 10),
            parseInt(startTime.split(':')[0], 10),
            parseInt(startTime.split(':')[1], 10)
          )
        );
        startDate = date.toISOString();
      } catch (err) {
        console.error('Error parsing start date:', err);
      }
    }

    return {
      eventName,
      venue,
      startDate,
      eventUrl,
      description,
    };
  }

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'getScrapedData') {
      const data = scrapeEventData();
      sendResponse({ eventData: data });
    }
    return true;
  });
})();
