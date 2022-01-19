# React Simple Table

## Intention

The table should be as easy as possible to use.

## Installation

### yarn
```bash
yarn add @postadress/react-simple-table
```

### npm
```bash
npm install @postadress/react-simple-table
```

## Usage

```js
import React, { FC } from 'react';
import { SimpleTable } from '@postadress/react-simple-table';
import { Field } from '@postadress/react-simple-table/dist/table';

export const Component: FC = () => {
  const data = [
    {
        id: 1,
        firstName: 'Johnny',
        lastName: 'Lawrence',
        age: 50,
    },
    {
        id: 2,
        firstName: 'Daniel',
        lastName: 'LaRusso',
        age: 50,
    },
    {
        id: 3,
        firstName: 'Miguel',
        lastName: 'Diaz',
        age: 17,
    },
    {
        id: 4,
        firstName: 'Samantha',
        lastName: 'LaRusso',
        age: 17,
    }
  ];

  const fields: Field[] = [
    {
      name: 'ID',
      identifier: 'id',
      width: 10,
    },
    {
      name: 'First Name',
      identifier: 'firstName',
    },
    {
      name: 'Last Name',
      identifier: 'lastName',
    },
    {
      name: 'Age',
      identifier: 'age',
      type: 'number'
    },
  ];

  return (<SimpleTable fields={fields} data={data} />);
};

```

The above example will lead to a table like this:

![React Simple Table example](https://github.com/postadress/react-simple-table/blob/master/table.png?raw=true)

Contributions are welcome!