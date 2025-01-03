function getData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const peopleSheet = ss.getSheetByName('People');
  const relationsSheet = ss.getSheetByName('Relations');
  
  // קריאת נתונים מגיליון אנשים
  const peopleData = peopleSheet.getDataRange().getValues();
  const peopleHeaders = peopleData.shift();
  
  const people = peopleData.map(row => {
    let person = {};
    peopleHeaders.forEach((header, index) => {
      person[header] = row[index];
    });
    return person;
  });
  
  // קריאת נתוני קשרים
  const relationsData = relationsSheet.getDataRange().getValues();
  const relationsHeaders = relationsData.shift();
  
  const relations = relationsData.map(row => {
    let relation = {};
    relationsHeaders.forEach((header, index) => {
      relation[header] = row[index];
    });
    return relation;
  });

  return {
    people: people,
    relations: relations
  };
}

/*
דוגמה למבנה נתונים בגיליון People:
id | firstName | lastName | birthDate
1  | ישראל    | ישראלי  | 1990-01-01
*/

/*
דוגמה למבנה נתונים בגיליון Relations:
id | personId1 | personId2 | relationType | marriageDate
1  | 123       | 456       | parent       | 
2  | 789       | 456       | spouse       | 2020-01-01
*/

function testData() {
  const data = getData();
  Logger.log(data.people.length);
  Logger.log(data.relations.length);
  Logger.log(data.people[0]);
  Logger.log(data.relations[0]);
}

function doGet() {
  // נסה לקבל את הנתונים
  let data;
  try {
    data = getData();
    Logger.log('Data in doGet:', data);  // בדיקה
  } catch (e) {
    Logger.log('Error getting data:', e);  // בדיקה
  }

  // נסה לשרשר את הנתונים לטמפלייט
  const template = HtmlService.createTemplateFromFile('Index');
  template.serverData = JSON.stringify(data);

  return template
    .evaluate()
    .setTitle('המשפחה שלי')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}