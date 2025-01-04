// popup.js



const client = window.SanityClient.createClient({
  projectId: 'e5nubesn',
  dataset: 'production',
  token: '',
  apiVersion: '2024-01-01',
  useCdn: false,
});

window.addEventListener('DOMContentLoaded', async () => {

  const eventData = await getScrapedEventDataFromActiveTab()

  const eventDataPre = document.getElementById('event-data');
  eventDataPre.textContent = JSON.stringify(eventData, null, 2);

  const saveButton = document.getElementById('save-button');
  saveButton.addEventListener('click', async () => {

    try {
      if (!eventData || !eventData.eventName) {
        alert('No event data found, cannot save.');
        return;
      }

    
      const locationRef = await getLocationReference(eventData.venue);
    
      const result = await createEventInSanity(eventData, locationRef);

    
      alert('Saved to Sanity!');
    } catch (err) {
    
      console.error('Error saving to sanity:', err);
      alert('Error saving to sanity. Check console.');
    }
  });
});

/**
 * Using the Chrome Tabs API to get the current active tab,
 * then sending a message to the content script to retrieve the scraped data.
 */
async function getScrapedEventDataFromActiveTab() {
  
  return new Promise((resolve, reject) => {
    
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      
      const activeTab = tabs[0];
      
      
      chrome.tabs.sendMessage(activeTab.id, 'getScrapedData', (response) => {
      
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        if (response && response.eventData) {
          resolve(response.eventData);
        } else {
          resolve({});
        }
      });
    });
  });
}

/**
 * Attempt to fetch the location reference from Sanity
 */
async function getLocationReference(venueName) {
  if (!venueName) return null;

  const query = `
    *[_type == "location" && (
      lower(name) == lower($name) ||
      count((altNames[])[lower(@) == lower($name)]) > 0
    )]{
      _id
    }[0]
  `;

  const params = { name: venueName };

  try {
    const locationDoc = await client.fetch(query, params);
    if (locationDoc && locationDoc._id) {
      return {
        _type: 'reference',
        _ref: locationDoc._id,
      };
    }
  } catch (err) {
    console.error('Error fetching location from Sanity:', err);
  }

  return null;
}

/**
 * Create an Event in Sanity, referencing the matched location
 */
async function createEventInSanity(eventData, locationRef) {
  const generateRandomSlug = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  const doc = {
    _type: 'event',
    name: eventData.eventName,
    startDate: eventData.startDate ?? null,
    description: eventData.description,
    location: locationRef, // the reference, or null
    url: eventData.eventUrl,
    slug: {
      _type: 'slug',
      current: generateRandomSlug(),
    },
  };

  try {
    const result = await client.create(doc); 
    return result;
  } catch (error) {
    console.error('Error creating event in Sanity:', error);
    throw error;
  }
}
