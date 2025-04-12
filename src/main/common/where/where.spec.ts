import {filter, find, findIndex} from './where'

describe('filter numbers', () => {
  const numbers = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
  ]

  it('number == 2 ', async () => {
    const criteria = {
      $eqeqeq: 2,
    }

    const res = filter<number>(numbers, criteria)

    expect(res.length).toBe(1)
    expect(res[0]).toBe(2)
  })

  it('3 < number <=6 ', async () => {
    const criteria = {
      $gt: 3,
      $lte: 6,
    }

    const res = filter<number>(numbers, criteria)

    expect(res.length).toBe(3)
    expect(res[0]).toBe(4)
    expect(res[2]).toBe(6)
  })

  it('x is even, x != 6 or x === 4', async () => {
    const criteria = {
      $even: true,
      $or: [
        {$neq: 6},
        {$eqeqeq: 4},
      ],
    }

    const res = filter<number>(numbers, criteria)
    expect(res.length).toBe(2)
    expect(res[0]).toBe(2)
    expect(res[1]).toBe(4)
  })

  it('x not odd and x not greater 5', async () => {
    const criteria = {
      $and: [
        {
          $not: {$odd: true},

        },
        {
          $not: {$gt: 5},
        },
      ],
    }

    const res = filter<number>(numbers, criteria)
    expect(res.length).toBe(2)
    expect(res[0]).toBe(2)
    expect(res[1]).toBe(4)
  })
})

describe('filter objects', () => {
  const objects = [
    {a: 1, b: 'aaaaaa'},
    {a: 2, b: 'bbbb42'},
    {a: 3, b: 'cccccc'},
    {a: 4, b: 'dddd42'},
    {a: 5, b: 'aaaa22'},
    {a: 6, b: 'aaaa00'},
    {a: 7, b: 'bbbb42'},
    {a: 8, b: '424242'},
  ]

  it('no element filtered out', async () => {
    const res = filter<any>(objects, {})

    expect(res.length).toBe(objects.length)
  })

  it('a === 2 (default is eq)', async () => {
    const criteria = {
      a: 2,
    }
    const res = filter<any>(objects, criteria)
    expect(res.length).toBe(1)
    expect(res[0].a).toBe(2)
  })

  it('b includes "42" and a not equal to 2', async () => {
    const criteria = {
      b$includes: '42',
      a$neq: 2,
    }
    const res = filter<any>(objects, criteria)
    expect(res.length).toBe(3)
  })

  it('a in 1,2,3,4', async () => {
    const criteria = {
      a$in: [1, 2, 3, 4],
    }
    const res = filter<any>(objects, criteria)
    expect(res.length).toBe(4)
    expect(res[3].a).toBe(4)
  })

  describe('find objects', () => {
    const objects = [
      {a: 1, b: 'aaaaaa'},
      {a: 2, b: 'bbbb42'},
      {a: 3, b: 'cccccc'},
      {a: 4, b: 'dddd42'},
      {a: 5, b: 'aaaa22'},
      {a: 6, b: 'aaaa00'},
      {a: 7, b: 'bbbb42'},
      {a: 8, b: '424242'},
    ]

    const criteria = {
      a: 2,
    }

    it('object.a == 2', async () => {
      const found = find<any>(objects, criteria)
      expect(found.a).toBe(2)
    })

    it('index a == 2', async () => {
      const foundIndex = findIndex<any>(objects, criteria)
      expect(foundIndex).toBe(1)
    })
  })
})
