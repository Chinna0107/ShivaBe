require('dotenv').config();
const db = require('./db.js');
const fs = require('fs');

async function run() {
  try {
    console.log('Adding medical_history column to leads...');
    await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS medical_history TEXT`);
    console.log('Added column successfully.');

    const routePath = './routes/leads.js';
    let code = fs.readFileSync(routePath, 'utf8');
    
    if (!code.includes('medicalHistory') && code.includes("router.post('/',")) {
      code = code.replace(
        'const { name, phone, email, date, type, gender, specificPlan, location, employmentType, annualIncome, education, smoker, lifeCover, members, vehicleNumber, vehicleType, vehicleManufacturer, vehicleModel, vehicleFuelType, vehicleCondition, vehicleRegDate, vehiclePincode } = req.body;',
        'const { name, phone, email, date, type, gender, specificPlan, location, employmentType, annualIncome, education, smoker, medicalHistory, lifeCover, members, vehicleNumber, vehicleType, vehicleManufacturer, vehicleModel, vehicleFuelType, vehicleCondition, vehicleRegDate, vehiclePincode } = req.body;'
      );

      code = code.replace(
        'education, smoker, life_cover, members, vehicle_number',
        'education, smoker, medical_history, life_cover, members, vehicle_number'
      );

      code = code.replace(
        '$12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *`,\n      [name, phone, email, date, type, gender, specificPlan, location, employmentType, annualIncome, education, smoker, lifeCover || null, Array.isArray(members) ? members.join(\', \') : members, vehicleNumber',
        '$12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING *`,\n      [name, phone, email, date, type, gender, specificPlan, location, employmentType, annualIncome, education, smoker, Array.isArray(medicalHistory) ? medicalHistory.join(\', \') : (medicalHistory || null), lifeCover || null, Array.isArray(members) ? members.join(\', \') : members, vehicleNumber'
      );
      
      fs.writeFileSync(routePath, code);
      console.log('Updated POST /api/leads route');
    } else {
      console.log('medical_history might already be in routes/leads.js or pattern did not match exactly.');
    }
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
