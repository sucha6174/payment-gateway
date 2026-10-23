const { Client } = require('pg');

async function setupLocalDb() {
  const adminClient = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
  });

  try {
    await adminClient.connect();
    console.log('Connected to local PostgreSQL as postgres.');

    // Check if role gateway_user exists
    const roleRes = await adminClient.query(
      "SELECT 1 FROM pg_roles WHERE rolname = 'gateway_user'"
    );
    if (roleRes.rows.length === 0) {
      await adminClient.query(
        "CREATE ROLE gateway_user WITH LOGIN PASSWORD 'gateway_pass' CREATEDB"
      );
      console.log('Role gateway_user created successfully.');
    } else {
      await adminClient.query(
        "ALTER ROLE gateway_user WITH PASSWORD 'gateway_pass'"
      );
      console.log('Role gateway_user updated with password.');
    }

    // Check if database payment_gateway exists
    const dbRes = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'payment_gateway'"
    );
    if (dbRes.rows.length === 0) {
      await adminClient.query('CREATE DATABASE payment_gateway OWNER gateway_user');
      console.log('Database payment_gateway created successfully.');
    } else {
      console.log('Database payment_gateway already exists.');
    }

    await adminClient.query('GRANT ALL PRIVILEGES ON DATABASE payment_gateway TO gateway_user');
    console.log('Permissions granted.');
  } catch (err) {
    console.error('Error in setupLocalDb:', err);
  } finally {
    await adminClient.end();
  }
}

setupLocalDb();
