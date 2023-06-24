const express = require('express');
const session = require('express-session');
const { body, validationResult } = require('express-validator');

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
  })
);
app.use(express.static('public'));



// Flight data
const flights = [
  { id: 1, airline: 'Flight 1', departure: 'City A', arrival: 'City B' },
  { id: 2, airline: 'Flight 2', departure: 'City C', arrival: 'City D' },
  { id: 3, airline: 'Flight 3', departure: 'City E', arrival: 'City F' }
  // Add more flights as needed
];

// User bookings
const bookings = [];

// Routes
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    if (req.session.adminLoggedIn) {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/dashboard');
    }
  } else {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Login/Register</title>
        </head>
        <body>
          <h1>Welcome to the Flight Booking Application!</h1>
          <p>Please login or register to proceed.</p>
          <a href="/login">Login</a> | <a href="/register">Register</a> | <a href="/admin">Admin Login</a>
        </body>
      </html>
    `);
  }
});

app.get('/dashboard', (req, res) => {
  if (req.session.loggedIn && !req.session.adminLoggedIn) {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Dashboard</title>
        </head>
        <body>
          <h1>Welcome to the Dashboard, ${req.session.email}!</h1>
          <ul>
            <li><a href="/book">Book a Ticket</a></li>
            <li><a href="/mybookings">My Bookings</a></li>
            <li><a href="/logout">Logout</a></li>
          </ul>
        </body>
      </html>
    `);
  } else {
    res.redirect('/login');
  }
});

app.get('/book', (req, res) => {
  if (req.session.loggedIn && !req.session.adminLoggedIn) {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Book a Ticket</title>
        </head>
        <body>
          <h1>Book a Ticket</h1>
          <form action="/book" method="post">
            <label for="flight">Select a Flight:</label>
            <select id="flight" name="flight" required>
              ${flights
                .map(
                  flight =>
                    `<option value="${flight.id}">${flight.airline} - Departure: ${flight.departure}, Arrival: ${flight.arrival}</option>`
                )
                .join('')}
            </select>
            <br><br>
            <input type="submit" value="Book">
          </form>
        </body>
      </html>
    `);
  } else {
    res.redirect('/login');
  }
});

app.post('/book', (req, res) => {
  const { flight } = req.body;

  // Check if the selected flight is available
  const selectedFlight = flights.find(f => f.id === parseInt(flight));
  if (!selectedFlight) {
    res.send('Invalid flight selection');
    return;
  }

  // Add the booking to the user's bookings
  const booking = {
    user: req.session.email,
    flight: selectedFlight
  };
  bookings.push(booking);

  res.send(`
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/css/styles.css">
        <title>Booking Confirmation</title>
      </head>
      <body>
        <h1>Booking Successful!</h1>
        <p>Thank you for booking a ticket.</p>
        <p>Flight: ${selectedFlight.airline}</p>
        <p>Departure: ${selectedFlight.departure}</p>
        <p>Arrival: ${selectedFlight.arrival}</p>
        <p>Booking Reference: ${bookings.length}</p>
        <a href="/dashboard">Go back to Dashboard</a>
      </body>
    </html>
  `);
});

app.get('/mybookings', (req, res) => {
  if (req.session.loggedIn && !req.session.adminLoggedIn) {
    const userBookings = bookings.filter(booking => booking.user === req.session.email);
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>My Bookings</title>
        </head>
        <body>
          <h1>My Bookings</h1>
          <ul>
            ${userBookings
              .map(
                (booking, index) => `
                  <li>
                    <p>Booking ${index + 1}</p>
                    <p>Flight: ${booking.flight.airline}</p>
                    <p>Departure: ${booking.flight.departure}</p>
                    <p>Arrival: ${booking.flight.arrival}</p>
                  </li>
                `
              )
              .join('')}
          </ul>
          <a href="/dashboard">Go back to Dashboard</a>
        </body>
      </html>
    `);
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/dashboard');
  } else {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Login</title>
        </head>
        <body>
          <h1>Login</h1>
          <form action="/login" method="post">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
            <br><br>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
            <br><br>
            <input type="submit" value="Login">
          </form>
        </body>
      </html>
    `);
  }
});

// Function to check if the provided email and password belong to an admin
function checkIfAdmin(email, password) {
  // Implement your logic here to determine if the email and password belong to an admin
  // You can query your database or use any other method to perform this check

  // For example, if you have a list of admin emails and passwords, you can check if the email and password match
  const adminCredentials = [
    { email: 'admin1@gmail.com', password: 'admin1' },
    { email: 'admin2@gmail.com', password: 'admin2' }
  ];

  return adminCredentials.some(
    admin => admin.email === email && admin.password === password
  );
}

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    // Check if the user is an admin
    const isAdmin = checkIfAdmin(email, password);

    req.session.loggedIn = true;
    req.session.adminLoggedIn = isAdmin;
    req.session.email = email;

    if (isAdmin) {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/dashboard');
    }
  } else {
    res.send('Invalid email or password');
  }
});




app.get('/register', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/dashboard');
  } else {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Register</title>
        </head>
        <body>
          <h1>Register</h1>
          <form action="/register" method="post">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required>
            <br><br>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
            <br><br>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
            <br><br>
            <input type="submit" value="Register">
          </form>
        </body>
      </html>
    `);
  }
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  // Save the user registration details
  // Replace this with your actual user registration logic

  res.redirect('/login');
});

app.get('/admin', (req, res) => {
  if (req.session.loggedIn && req.session.adminLoggedIn) {
    res.redirect('/admin/dashboard');
  } else {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Admin Login</title>
        </head>
        <body>
          <h1>Admin Login</h1>
          <form action="/admin/login" method="post">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
            <br><br>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
            <br><br>
            <input type="submit" value="Login">
          </form>
        </body>
      </html>
    `);
  }
});

app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  // Authenticate the admin
  // Replace this with your actual admin authentication logic
  if (email === 'admin@example.com' && password === 'admin') {
    req.session.loggedIn = true;
    req.session.adminLoggedIn = true;
    req.session.email = email;
    res.redirect('/admin/dashboard');
    return;
  }

  res.send('Invalid email or password');
});

app.get('/admin/dashboard', (req, res) => {
  if (req.session.loggedIn && req.session.adminLoggedIn) {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Admin Dashboard</title>
        </head>
        <body>
          <h1>Welcome to the Admin Dashboard, ${req.session.email}!</h1>
          <ul>
            <li><a href="/admin/manage-flights">Manage Flights</a></li>
            <li><a href="/admin/view-bookings">View Bookings</a></li>
            <li><a href="/logout">Logout</a></li>
          </ul>
        </body>
      </html>
    `);
  } else {
    res.redirect('/admin');
  }
});

app.get('/admin/manage-flights', (req, res) => {
  if (req.session.loggedIn && req.session.adminLoggedIn) {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Manage Flights</title>
        </head>
        <body>
          <h1>Manage Flights</h1>
          <ul>
            <li><a href="/admin/add-flight">Add Flight</a></li>
            <li><a href="/admin/remove-flight">Remove Flight</a></li>
          </ul>
        </body>
      </html>
    `);
  } else {
    res.redirect('/admin');
  }
});

app.get('/admin/add-flight', (req, res) => {
  if (req.session.loggedIn && req.session.adminLoggedIn) {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Add Flight</title>
        </head>
        <body>
          <h1>Add Flight</h1>
          <form action="/admin/add-flight" method="post">
            <label for="airline">Airline:</label>
            <input type="text" id="airline" name="airline" required>
            <br><br>
            <label for="departure">Departure:</label>
            <input type="text" id="departure" name="departure" required>
            <br><br>
            <label for="arrival">Arrival:</label>
            <input type="text" id="arrival" name="arrival" required>
            <br><br>
            <input type="submit" value="Add Flight">
          </form>
        </body>
      </html>
    `);
  } else {
    res.redirect('/admin');
  }
});

app.post('/admin/add-flight', (req, res) => {
  const { airline, departure, arrival } = req.body;

  // Add the flight to the flights list
  const newFlight = {
    id: flights.length + 1,
    airline,
    departure,
    arrival
  };
  flights.push(newFlight);

  res.send('Flight added successfully!');
});

app.get('/admin/remove-flight', (req, res) => {
  if (req.session.loggedIn && req.session.adminLoggedIn) {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          <title>Remove Flight</title>
        </head>
        <body>
          <h1>Remove Flight</h1>
          <form action="/admin/remove-flight" method="post">
            <label for="flightId">Flight ID:</label>
            <input type="number" id="flightId" name="flightId" required>
            <br><br>
            <input type="submit" value="Remove Flight">
          </form>
        </body>
      </html>
    `);
  } else {
    res.redirect('/admin');
  }
});

app.post('/admin/remove-flight', (req, res) => {
  const { flightId } = req.body;

  // Remove the flight from the flights list
  const index = flights.findIndex(f => f.id === parseInt(flightId));
  if (index !== -1) {
    flights.splice(index, 1);
    res.send('Flight removed successfully!');
  } else {
    res.send('Invalid flight ID');
  }
});

app.get('/admin/view-bookings', (req, res) => {
  if (req.session.loggedIn && req.session.adminLoggedIn) {
    res.send(`
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/css/styles.css">
          title>View Bookings</title>
        </head>
        <body>
          <h1>View Bookings</h1>
          <ul>
            ${bookings
              .map(
                (booking, index) => `
                  <li>
                    <p>Booking ${index + 1}</p>
                    <p>User: ${booking.user}</p>
                    <p>Flight: ${booking.flight.airline}</p>
                    <p>Departure: ${booking.flight.departure}</p>
                    <p>Arrival: ${booking.flight.arrival}</p>
                  </li>
                `
              )
              .join('')}
          </ul>
        </body>
      </html>
    `);
  } else {
    res.redirect('/admin');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
