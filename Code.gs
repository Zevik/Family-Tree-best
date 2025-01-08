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
  
  // Find column indices
  const idIndex = headers.indexOf('מזהה');
  const firstNameIndex = headers.indexOf('שם פרטי');
  const lastNameIndex = headers.indexOf('שם משפחה');
  const hebrewDateIndex = headers.indexOf('תאריך לידה עברי');
  const gregDateIndex = headers.indexOf('תאריך לידה');
  const fatherIdIndex = headers.indexOf('אבא');
  const motherIdIndex = headers.indexOf('אמא');
  const spouseIdIndex = headers.indexOf('בן/בת זוג');
  
  // Create maps for people and relationships
  const peopleMap = new Map();
  const childrenByParent = new Map();
  
  // First pass: Create people map
  values.slice(1).forEach(row => {
    const id = row[idIndex]?.toString();
    if (id) {
      peopleMap.set(id, {
        id: id,
        firstName: row[firstNameIndex],
        lastName: row[lastNameIndex],
        fatherId: row[fatherIdIndex]?.toString(),
        motherId: row[motherIdIndex]?.toString(),
        spouseId: row[spouseIdIndex]?.toString(),
        hebrewDate: row[hebrewDateIndex],
        gregorianDate: row[gregDateIndex]
      });
    }
  });
  
  // Second pass: Build parent-child relationships
  peopleMap.forEach(person => {
    if (person.fatherId) {
      if (!childrenByParent.has(person.fatherId)) {
        childrenByParent.set(person.fatherId, new Set());
      }
      childrenByParent.get(person.fatherId).add(person.id);
    }
    if (person.motherId) {
      if (!childrenByParent.has(person.motherId)) {
        childrenByParent.set(person.motherId, new Set());
      }
      childrenByParent.get(person.motherId).add(person.id);
    }
  });
  
  // Calculate relationships for each person
  const data = Array.from(peopleMap.values()).map(person => {
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
