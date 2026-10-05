const Tour = require('../models/tourModel');
const buildTourQuery = require('../utils/tourQuery');
const AppError = require('../utils/appError');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'),
// );

// Param Middleware used in Tour Routes
/*exports.checkId = (req, res, next, value) => {
  const id = Number(value);
  console.log('Tour Id: ', value);

  if (!tours.some((tour) => tour.id === id)) {
    return res.status(404).json({
      status: 'not found',
      message: `Tour with ID ${id} not found`,
    });
  }

  next();
};*/

// Middleware to check body content
/*exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'bad request',
      message: 'Please fill out name and price',
    });
  }

  next();
};*/

exports.getAllTours = async (req, res) => {
  // Build Query
  const queryInput = { ...req.query };

  const { query, filter, pagination } = buildTourQuery(Tour.find(), queryInput);

  const totalTours = await Tour.countDocuments(filter);
  const totalPages = Math.ceil(totalTours / pagination.limit);

  if (pagination.page > totalPages && totalTours > 0) {
    throw new AppError('This page does not exist', 404);
  }

  // Execute query
  const tours = await query;

  // Send response
  res.status(200).json({
    status: 'success',
    time: req.requestTime,
    results: tours.length,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      totalResults: totalTours,
    },
    data: { tours },
  });
};

exports.getTour = async (req, res) => {
  const tourId = req.params.id;
  const tour = await Tour.findById(tourId);
  // findOne({ _id: id })

  if (!tour) throw new AppError('No tour found with that ID', 404);

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
};

exports.createTour = async (req, res) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
};

/*exports.createTour = (req, res) => {

  const tourTourId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: tourTourId }, req.body);

  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).send({
        status: 'success',
        data: { tour: newTour },
      });
    },
  );
};*/

exports.updateTour = async (req, res) => {
  const tourId = req.params.id;
  const tour = await Tour.findByIdAndUpdate(tourId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) throw new AppError('No tour found with that ID', 404);

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
};

exports.deleteTour = async (req, res) => {
  const tourId = req.params.id;
  const tour = await Tour.findByIdAndDelete(tourId);

  if (!tour) throw new AppError('No tour found with that ID', 404);

  // For delete requests, set status 204, and no response body sent back
  res.status(204).send();
};

exports.getTourStats = async (req, res) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: '$difficulty',
        numOfTours: { $sum: 1 },
        numOfRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
};

exports.getMonthlyPlan = async (req, res) => {
  const year = Number(req.params.year);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numToursStarts: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { plan },
  });
};
