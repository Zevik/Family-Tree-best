function getData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const peopleSheet = ss.getSheetByName('People');
  const relationsSheet = ss.getSheetByName('Relations');

  // קריאת נתונים מגיליון אנשים
  const peopleData = peopleSheet.getDataRange().getValues();
  const peopleHeaders = peopleData.shift();

  Logger.log('People headers after shift:', peopleHeaders);

  const people = peopleData.map(row => {
    let person = {};
    peopleHeaders.forEach((header, index) => {
      if (header && (header.toLowerCase() === 'birthdate' || header.toLowerCase() === 'dateofbirth')) {
        if (row[index] instanceof Date) {
          person['birthDate'] = row[index].toISOString().split('T')[0];
        } else {
          const date = new Date(row[index]);
          if (!isNaN(date.getTime())) {
            person['birthDate'] = date.toISOString().split('T')[0];
          } else {
            Logger.log(`Invalid date format for ${row[peopleHeaders.indexOf('firstName')]}: ${row[index]}`);
          }
        }
        Logger.log(`Birth date for ${row[peopleHeaders.indexOf('firstName')]}: ${person['birthDate']}`);

      } else {
        person[header] = row[index];
      }
    });
    Logger.log(`Person object:`, person);
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

// הוספת פונקציית בדיקה לתאריכים
function testDates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('People');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const birthDateIndex = headers.indexOf('birthDate');

  if (birthDateIndex === -1) {
    Logger.log('No birthDate column found!');
    return;
  }

  data.slice(1).forEach((row, index) => {
    const birthDate = row[birthDateIndex];
    Logger.log(`Row ${index + 2}: ${birthDate} (${typeof birthDate})`);
    if (birthDate instanceof Date) {
      Logger.log(`Valid date: ${birthDate.toISOString()}`);
    } else {
      const date = new Date(birthDate);
      if (!isNaN(date.getTime())) {
        Logger.log(`Converted date: ${date.toISOString()}`);
      } else {
        Logger.log(`Invalid date format: ${birthDate}`);
      }
    }
  });
}