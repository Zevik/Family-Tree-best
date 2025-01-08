function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
      .setTitle('עץ משפחה')
      .setFaviconUrl('https://www.google.com/favicon.ico')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Get headers
  const headers = values[0];
  
  // Column indexes (0-based, from right to left)
  const idIndex = 0;            // A - מזהה
  const firstNameIndex = 1;     // B - שם פרטי
  const lastNameIndex = 2;      // C - שם משפחה
  const gregDateIndex = 3;      // D - תאריך לידה
  const hebrewDateIndex = 4;    // E - תאריך לידה עברי
  const gregDeathDateIndex = 9; // J - תאריך פטירה
  const hebrewDeathDateIndex = 10; // K - תאריך פטירה עברי
  const fatherIdIndex = 12;     // M - אבא
  const motherIdIndex = 13;     // N - אמא
  const spouseIdIndex = 14;     // O - בן/בת זוג
  const marriageDateIndex = 15; // P - תאריך נישואין
  const hideIndex = 16;         // Q - לא להציג
  
  // Create maps for people and relationships
  const peopleMap = new Map();
  const childrenByParent = new Map();
  
  // First pass: Create people map - add everyone
  values.slice(1).forEach(row => {
    const id = row[idIndex]?.toString();
    if (id) {
      // Debug logging for couples
      const spouseId = row[spouseIdIndex]?.toString();
      if (spouseId) {
        console.log(`\nChecking couple:`);
        console.log(`Person ID: ${id}`);
        console.log(`Name: ${row[firstNameIndex]} ${row[lastNameIndex]}`);
        console.log(`Spouse ID: ${spouseId}`);
        console.log(`Marriage Date (Column P): ${row[marriageDateIndex]}`);
        console.log(`Marriage Date type: ${typeof row[marriageDateIndex]}`);
        console.log(`Marriage Date raw value:`, row[marriageDateIndex]);
      }
      
      peopleMap.set(id, {
        id: id,
        firstName: row[firstNameIndex],
        lastName: row[lastNameIndex],
        fatherId: row[fatherIdIndex]?.toString(),
        motherId: row[motherIdIndex]?.toString(),
        spouseId: row[spouseIdIndex]?.toString(),
        marriageDate: row[marriageDateIndex],
        hebrewDate: row[hebrewDateIndex],
        gregorianDate: row[gregDateIndex],
        hebrewDeathDate: row[hebrewDeathDateIndex],
        gregorianDeathDate: row[gregDeathDateIndex],
        isHidden: row[hideIndex] === "HIDE"
      });
    }
  });
  
  // Second pass: Build parent-child relationships
  peopleMap.forEach(person => {
    console.log(`\nChecking person: ${person.firstName} ${person.lastName} (ID: ${person.id})`);
    console.log(`Father ID: ${person.fatherId}, Mother ID: ${person.motherId}`);
    
    if (person.fatherId) {
      if (!childrenByParent.has(person.fatherId)) {
        childrenByParent.set(person.fatherId, new Set());
      }
      childrenByParent.get(person.fatherId).add(person.id);
      console.log(`Added as child to father ID: ${person.fatherId}`);
    }
    if (person.motherId) {
      if (!childrenByParent.has(person.motherId)) {
        childrenByParent.set(person.motherId, new Set());
      }
      childrenByParent.get(person.motherId).add(person.id);
      console.log(`Added as child to mother ID: ${person.motherId}`);
    }
  });
  
  // Log the childrenByParent map for debugging
  console.log('\nComplete children map:');
  childrenByParent.forEach((children, parentId) => {
    const parent = peopleMap.get(parentId);
    if (parent) {
      console.log(`\nParent: ${parent.firstName} ${parent.lastName} (ID: ${parentId})`);
      console.log('Children IDs:', Array.from(children));
    }
  });
  
  // Calculate relationships for each person
  const data = Array.from(peopleMap.values())
    .filter(person => !person.isHidden)
    .map(person => {
      // Get spouse info
      const spouse = person.spouseId ? peopleMap.get(person.spouseId) : null;
      
      // Get children
      const children = Array.from(childrenByParent.get(person.id) || [])
        .map(childId => {
          const child = peopleMap.get(childId);
          return child ? {
            id: childId,
            name: `${child.firstName} ${child.lastName}`
          } : null;
        })
        .filter(child => child !== null);
      
      // Get siblings
      const fatherSiblings = person.fatherId ? 
        Array.from(childrenByParent.get(person.fatherId) || []) : [];
      const motherSiblings = person.motherId ? 
        Array.from(childrenByParent.get(person.motherId) || []) : [];
      
      const siblingIds = new Set([...fatherSiblings, ...motherSiblings]
        .filter(id => id !== person.id));
      
      const siblings = {
        fullSiblings: [],
        halfSiblings: []
      };
      
      siblingIds.forEach(siblingId => {
        const sibling = peopleMap.get(siblingId);
        if (sibling) {
          if (sibling.motherId === person.motherId && sibling.fatherId === person.fatherId) {
            siblings.fullSiblings.push({
              id: siblingId,
              name: `${sibling.firstName} ${sibling.lastName}`
            });
          } else {
            siblings.halfSiblings.push({
              id: siblingId,
              name: `${sibling.firstName} ${sibling.lastName}`,
              relationship: sibling.motherId === person.motherId ? 'מאם' : 'מאב'
            });
          }
        }
      });
      
      return {
        ...person,
        parents: {
          father: person.fatherId ? `${peopleMap.get(person.fatherId)?.firstName || ''} ${peopleMap.get(person.fatherId)?.lastName || ''}` : null,
          mother: person.motherId ? `${peopleMap.get(person.motherId)?.firstName || ''} ${peopleMap.get(person.motherId)?.lastName || ''}` : null
        },
        spouse: spouse ? `${spouse.firstName} ${spouse.lastName}` : null,
        children: children,
        siblings: siblings
      };
    });
  
  return data;
}
