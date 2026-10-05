const buildFilter = (queryInput) => {
  const queryObj = { ...queryInput };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];

  excludedFields.forEach((field) => delete queryObj[field]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  return JSON.parse(queryStr);
};

const buildSort = (queryInput) => {
  if (!queryInput.sort) return '-_id';

  return queryInput.sort.split(',').join(' ');
};

const buildFields = (queryInput) => {
  if (!queryInput.fields) return '-__v';

  return queryInput.fields.split(',').join(' ');
};

const buildPagination = (queryInput) => {
  const page = Number(queryInput.page) || 1;
  const limit = Number(queryInput.limit) || 100;
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

const tourQuery = (baseQuery, queryInput) => {
  const filter = buildFilter(queryInput);
  const sort = buildSort(queryInput);
  const fields = buildFields(queryInput);
  const pagination = buildPagination(queryInput);

  const query = baseQuery
    .find(filter)
    .sort(sort)
    .select(fields)
    .skip(pagination.skip)
    .limit(pagination.limit);

  return {
    query,
    filter,
    pagination,
  };
};

module.exports = tourQuery;
