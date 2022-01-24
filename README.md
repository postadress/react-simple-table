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

React Simple Table uses the location for storing filter strings. Therefore it mus be used inside a Router component.

A basic example:

```js
import React, { FC } from 'react';
import { SimpleTable } from '@postadress/react-simple-table';
import { Field } from '@postadress/react-simple-table/dist/table';

export const Component: FC = () => {
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

  return (<SimpleTable fields={fields} data={data} />);
};

```

The above example will lead to a table like this:

![React Simple Table example](https://github.com/postadress/react-simple-table/blob/master/table.png?raw=true)


## Api

### Field
Interface for column definitions.

| Property       | Type                            | Optional | Default | Purpose                                                                                   | Example                                    |
|----------------|---------------------------------|----------|---------|-------------------------------------------------------------------------------------------|--------------------------------------------|
| name           | string                          | no       |         | This is the name of the column and therefore it is shown in the header row.               | name: 'First name'                         |
| identifier     | string                          | no       |         | Technical identifier for the column. The `name` must not be unique, the identifier must.  | identifier: 'firstName'                    |
| width          | number                          | yes      |         | The with of the column in px.                                                             | width: 120                                 |
| formatter      | function                        | yes      |         | A callback function which is used to render the cell content.                             | (val, name, row) => <>{'#' + val}</>       |
| getSortValue   | function                        | yes      |         | A callback function which is used to sort rows.                                           | (val, name, row) => dateToIso(val);        |
| getFilterValue | function                        | yes      |         | A callback function which is used to filter rows.                                         | (val, name, row) => dateToGermanDate(val); |
| type           | 'button', 'checkbox', 'color' * | yes      | text    | HTML5 input types. Used to render edit input fields.                                      | type: 'date',                              |
| editable       | boolean                         | yes      | false   | If `true`, the cell can be edited by double clicking on it.                               | editable: true                             |
| disableSorting | boolean                         | yes      | false   | If `true`, the cell can be edited by double clicking on it.                               | disableSorting: true                       |

[<font size="2">* 'button' | 'checkbox' | 'color' | 'date' | 'datetime' | 'email' | 'file' | 'hidden' | 'image' | 'month' | 'number' | 'password' | 'radio' | 'range' | 'reset' | 'search' | 'submit' | 'tel' | 'text' | 'time' | 'url' | 'week'</font>](#Content)

### DatatableProps
Interface to configure the table itself.

| Property   | Type    | Optional | Default  | Purpose                                                                                                                                                          | Example                                               |
|------------|---------|----------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| fields     | Field[] | no       |          | The field definitions to be used by the table.                                                                                                                   | fields: [{name: 'name', identifier: 'name'}]          |
| data       | any[]   | no       |          | The data to be presented in the table.                                                                                                                           | [{name: 'Johnny Lawrence'}, {name: 'Daniel LaRusso'}] |
| showFilter | boolean | yes      | false    | If `true` the filter widget above the table is is visible.                                                                                                       | showFilter: true                                      |
| identifier | string  | yes      | 'filter' | Used to discriminate different tables on a page. The main purpose is: It is used in the location portion of the URL, to decide, to which table a filter belongs. | identifier: 'mainTable'                               |
| lang       | string  | yes      | 'en'     | Used for i18n. Currently only English and German is available.                                                                                                   | lang: 'de'                                            |

You can find a working example on [CodeSandbox](https://codesandbox.io/s/react-simple-table-example-4bfk3?file=/src/Table.tsx).

Contributions are welcome!