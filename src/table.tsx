import {
  faAngleDown, faAngleUp, faMinus, faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, {
  FC, Fragment, MutableRefObject, useEffect, useRef, useState,
} from 'react';
import {
  Col, Container, Row,
} from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { i18n } from './languages/i18n';

export interface Field {
  name: string;
  identifier: string;
  width?: number;
  formatter?: (val: any, name: string, row: any) => string | JSX.Element;
  csvFormatter?: (val: any, name: string, row: any) => string | JSX.Element;
  getSortValue?: (val: any, name: string, row: any) => string;
  getFilterValue?: (val: any, name: string, row: any) => string;
  editable?: boolean;
  onEdit?: (val: string, field: Field, row: any, index: number) => void;
  disableSorting?: boolean,
  type?: 'button' | 'checkbox' | 'color' | 'date' | 'datetime' | 'email' | 'file' | 'hidden' |
    'image' | 'month' | 'number' | 'password' | 'radio' | 'range' | 'reset' | 'search' | 'submit'
    | 'tel' | 'text' | 'time' | 'url' | 'week'
}

export interface DatatableProps {
  fields: Field[]
  data: any[],
  onExpand?: (idx: number, row: any) => JSX.Element,
  showFilter?: boolean,
  showDownload?: boolean,
  hideResultCount?: boolean,
  lang?: string,
  identifier?: string,
  customDownloadFunction?: (tableData: any[]) => void;
  pageSize?: number;
  onFetchAdditionalResults?: () => void;
  showRowFilters?: boolean;
  rowCount?: number;
}

const useIntersection = (ref: MutableRefObject<Element | null>) => {
  const [element, setElement] = useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observer = useRef<null | IntersectionObserver>(null);
  const cleanOb = () => {
    if (observer.current) {
      observer.current.disconnect();
    }
  };

  useEffect(() => {
    setElement(ref.current);
  }, [ref]);

  useEffect(() => {
    if (!element) {
      return;
    }
    cleanOb();
    observer.current = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    });
    const ob = observer.current;
    ob.observe(element);
    return () => {
      cleanOb();
    };
  }, [element]);
  return isIntersecting;
};

function useUrlForm(paramname: string, initial: any) {
  const [search, setSearch] = useSearchParams(paramname);
  const searchAsObject = Object.fromEntries(new URLSearchParams(search));

  if (!searchAsObject[paramname]) {
    return [{ ...initial, ...searchAsObject }, updateForm]
  }

  function updateForm (val: Partial<any>) {
    if (!searchAsObject[paramname]) {
      setSearch({...searchAsObject, [paramname]: JSON.stringify({...initial, ...val}) })
    } else {
      const newVal = { ...JSON.parse(searchAsObject[paramname]), ...val };
      setSearch({...searchAsObject, [paramname]: JSON.stringify(newVal) })
    }
  }
  return [JSON.parse(searchAsObject[paramname]), updateForm] as const;
}

export const SimpleTable: FC<DatatableProps> = (props) => {
  const {
    fields, data, onExpand, showFilter, showDownload, hideResultCount, identifier = 'filter', pageSize = 1000, onFetchAdditionalResults, showRowFilters, rowCount,
    lang = 'en', customDownloadFunction,
  } = props;
  const [tableData, setTableData] = useState<any[]>();
  const [sortedBy, setSortedBy] = useState<{field: Field, dir: string}>();

  const initials = [['filter', ''], ...fields.map(f => [f.identifier, ''])]
  const [searchParams, setSearchParams] = useUrlForm(identifier, Object.fromEntries(initials));

  const filter = searchParams['filter'];

  const [ rowFilter, setRowFilter ] = useState<string>(fields[0].identifier);
  const [ rowOperator, setRowOperator ] = useState<string>('isEqual');

  const [editable, setEditble] = useState<{index: number, field: Field, name: string}>();
  const [maxIdx, setMaxId] = useState<number>(pageSize);
  const [expanded, setExpanded] = useState<number[]>([]);

  const ref = useRef(null);
  const inViewPort = useIntersection(ref);

  const i = new i18n(lang);

  const [refData, setRefData] = useState<any[]>([]);

  useEffect(() => {
    if (data) {
      setRefData([...refData, ...data])
    }
  }, [data]);

  const handleFilterChange = (val: string) => {
    setSearchParams({'filter': val});
  };

  const getDisplayValue = (field: Field, row: any) => {
    if (!field.formatter) {
      return row[field.identifier];
    }
    return field.formatter(row[field.identifier], field.name, row);
  };

  const getCsvDisplayValue = (field: Field, row: any) => {
    if (field.csvFormatter) {
      return field.csvFormatter(row[field.identifier], field.name, row)
    }
    return getDisplayValue(field, row);
  };

  const getFilterValue = (field: Field, row: any) => {
    if (!field.getFilterValue) {
      return row[field.identifier] || '';
    }
    if (row[field.identifier]) {
      return field.getFilterValue(row[field.identifier], field.identifier, row);
    }
    return field.getFilterValue('', field.identifier, row);
  }

  const getSortValue = (field: Field, row: any) => {
    if (!field.getSortValue) {
      const val = row[field.identifier]
      return val ? val : '';
    }
    if (row[field.identifier]) {
      const val = field.getSortValue(row[field.identifier], field.identifier, row);
      return val ? val : '';
    }
    const val = field.getSortValue('', field.identifier, row);
    return val ? val : '';
  };

  const asc = (sotData: any[], field: Field) => {
    return sotData.sort(
      (a, b) => (getSortValue(field, a) > getSortValue(field, b) ? 1 : -1),
    ).map((i) => i);
  };

  const desc = (sortData: any[], field: Field) => {
    return sortData.sort(
      (a, b) => (getSortValue(field, a) < getSortValue(field, b) ? 1 : -1),
    ).map((i) => i);
  };

  const sortData = (field: Field) => {
    setExpanded([]);
    if (sortedBy && sortedBy.field === field && sortedBy.dir === 'a') {
      const sorted = desc(tableData || [], field);
      setSortedBy({ field, dir: 'd' });
      setTableData(sorted);
    } else {
      setSortedBy({ field, dir: 'a' });
      const sorted = asc(tableData || [], field);
      setTableData(sorted);
    }
  };

  useEffect(() => {
    if (onFetchAdditionalResults && inViewPort && refData) {
      onFetchAdditionalResults();
      setMaxId(maxIdx + pageSize);
    }

    if (!onFetchAdditionalResults && inViewPort && refData && maxIdx <= refData.length) {
      setMaxId(maxIdx + pageSize);
    }
  }, [inViewPort])

  useEffect(() => {
    if (refData) {
      let enriched = refData;

      if (showFilter) {
        enriched = refData.map((item) => {
          return {
            ...item,
            filterHash: fields.map(
              (field: Field) => `${getFilterValue(field, item)}`.toLowerCase()).join(' '),
          };
        })
        .filter((item) => item.filterHash.includes(filter.toLocaleLowerCase()) || filter === '')
        .filter((item) => {
          return fields.filter(field => {
            if (rowOperator === 'isEqual') {
              return `${getFilterValue(field, item)}` === `${searchParams[field.identifier]}` || `${searchParams[field.identifier]}` === '';
            }
            if (rowOperator === 'isEmpty') {
              return item[field.identifier] === '' || item[field.identifier] === null ||  item[field.identifier] === undefined || searchParams[field.identifier] === '';
            }
          }).length === fields.length;
        });
      }

      if (sortedBy) {
        if (sortedBy.dir === 'a') {
          const sorted = asc(enriched, sortedBy.field);
          setTableData(sorted);
        } else {
          const sorted = desc(enriched, sortedBy.field);
          setTableData(sorted);
        }
      }
      setTableData(enriched);
    }
  }, [refData, rowOperator, rowFilter, filter, ...fields.map(f => searchParams[f.identifier]), maxIdx]);

  useEffect(() => {
    resetFilters();
  }, []);

  const resetFilters = () => {
    setSearchParams({
      ...Object.fromEntries([['filter', ''], ...fields.map(f => [f.identifier, ''])])
    })
    setRowOperator('isEqual');
    setRowFilter(fields[0].identifier);
  }

  const handleClick = (e: any, index: number, row: any, name: string, field: Field) => {
    if (e.detail === 2 && field.editable) {
      setEditble({ index, field: row, name });
    }
  };

  const handleEditCell = (index: number, val: string, field: Field) => {
    const rows = tableData?.map((item, idx) => {
      if (idx !== index) {
        return item;
      }
      const { identifier } = field;
      return { ...item, [identifier]: val };
    });
    setTableData(rows);
  };

  const handleCommit = (index: number, field: Field, row: any) => {
    setEditble(undefined)
    if (field.onEdit) {
      field.onEdit(row[field.identifier], field, row, index);
    }
  }

  const getIcon = () => ((sortedBy?.dir === 'a')
    ? <FontAwesomeIcon icon={faAngleUp} />
    : <FontAwesomeIcon icon={faAngleDown} />);

  const handleExpandRow = (idx: number) => {
    expanded.includes(idx)
      ? setExpanded(expanded.filter((i) => i !== idx))
      : setExpanded([...expanded, idx]);
  };

  const toDateTimeIso = (date: Date): string => {
    return `${date.getFullYear()}-${(`0${date.getMonth() + 1}`).slice(-2)}-`
      + `${(`0${date.getDate()}`).slice(-2)} ${(`0${date.getHours()}`).slice(-2)}:`
      + `${(`0${date.getMinutes()}`).slice(-2)}:${(`0${date.getSeconds()}`).slice(-2)}`;
  }

  const defaultDownloadFunction = (csvData: any[]) => {
    const headers = fields.map(f => f.name).join(',');
    const payload = csvData.map((item) => fields.map((field) => getCsvDisplayValue(field, item))).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${payload}`;
    let encodeUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute('href', encodeUri);
    link.setAttribute('download', toDateTimeIso(new Date()));
    document.body.appendChild(link);
    link.click();
  }

  return (
    <>
      <Container fluid>
        <Row>
          { showFilter &&
              <Col>
                <input
                  className="form-control mb-3"
                  placeholder="Filter"
                  value={filter}
                  type="text"
                  onChange={(v) => handleFilterChange(v.target.value)}
                />
              </Col>
            }
            { showRowFilters &&
              <>
                <Col>
                  <select
                    value={rowFilter}
                    className='form-select'
                    onChange={evt => {
                      setRowFilter(evt.currentTarget.value);
                      setRowOperator('isEqual');
                      setSearchParams({
                        ...Object.fromEntries([['filter', filter], ...fields.map(f => [f.identifier, ''])])
                      })
                    }}
                  >
                    { fields.map((field, idx) => (
                      <option
                        key={idx}
                        value={ field.identifier }
                      >
                        { field.name }
                      </option>
                    ))}
                  </select>
                </Col>

                <Col>
                  <select
                    value={rowOperator}
                    className='form-select'
                    onChange={evt => {
                      setRowOperator(evt.currentTarget.value);
                      if (evt.currentTarget.value === 'isEmpty') {
                        setSearchParams({[rowFilter]: "[%empty%]"})
                      } else {
                        setSearchParams({[rowFilter]: ""})
                      }
                    }}
                  >
                    <option
                      key={1}
                      value={ 'isEqual' }
                    >
                      { i('isequal') }
                    </option>
                    <option
                      key={2}
                      value={ 'isEmpty' }
                    >
                      { i('isempty') }
                    </option>
                  </select>
                </Col>
                <Col>
                  <input
                    className="form-control mb-3"
                    value={rowOperator === 'isEmpty' ? '' : searchParams[rowFilter]}
                    disabled={rowOperator === 'isEmpty'}
                    type="text"
                    onChange={(v) => setSearchParams({[rowFilter]: v.currentTarget.value})}
                  />
                </Col>
                </>
              }
              { (showFilter || showRowFilters) && (
                <Col>
                  <button
                    onClick={() => resetFilters()}
                    className='btn btn-secondary ml-3 mr-3'>
                      { i('resetfilters') }
                  </button>
                </Col>
              )
            }

          { (!hideResultCount || showDownload) &&
            <Col className="d-flex flex-row-reverse mt-2">
              { showDownload && (
                <button
                  disabled={rowCount ? (rowCount === 0) : (tableData?.length === 0)}
                  onClick={() => (customDownloadFunction !== undefined)
                    ? customDownloadFunction(tableData || [])
                    : defaultDownloadFunction(tableData || [])
                  }
                  className='btn btn-secondary ml-3 mr-3'>
                    { i('download') }
                  </button>
              ) }
              { !hideResultCount &&
                <span style={{marginRight: 30}}>
                  {' '}
                  {rowCount ? rowCount : tableData?.length}
                  {' '}
                  { i('results') }
                </span>
              }
            </Col>
          }
        </Row>
        <Row>
          <Col>
            <table className="table">
              <thead>
                <tr>
                  { onExpand && <th scope="col" style={{ width: 1 }} />}
                  { fields.map((field, idx) => {
                    const dirIdentifier = (field.identifier === sortedBy?.field.identifier)
                      ? getIcon()
                      : '';
                    return (
                      <th
                        scope="col"
                        style={!field.disableSorting ? { cursor: 'pointer' } : {}}
                        key={idx}
                        onClick={!field.disableSorting ? () => sortData(field) : undefined}
                      >
                        {field.name}
                        {' '}
                        {dirIdentifier}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {tableData && tableData.slice(0, maxIdx).map((row, idx) => (
                  <Fragment key={idx}>
                    <tr className="align-middle">
                      { onExpand
                            && (
                            <td
                              style={{ width: 1, cursor: 'pointer' }}
                              onClick={() => handleExpandRow(idx)}
                            >
                              {expanded.includes(idx)
                                ? <FontAwesomeIcon icon={faMinus} />
                                : <FontAwesomeIcon icon={faPlus} />}
                            </td>
                            )}
                      { fields.map((field, i) => {
                        const val = getDisplayValue(field, row);
                        if (editable
                            && editable.index === idx
                            && editable.name === field.identifier) {
                          return (
                            <td style={{ width: field.width || 150 }} key={i}>
                              <input
                                type={field.type ? field.type : 'text'}
                                onChange={(e) => handleEditCell(idx, e.target.value, field)}
                                className="form-control"
                                value={val}
                                onBlur={() => handleCommit(idx, field, row)}
                              />
                            </td>
                          );
                        }
                        return (
                          <td
                            onClick={(e) => handleClick(e, idx, row, field.identifier, field)}
                            style={{ width: field.width || 150 }}
                            key={i}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                    {onExpand && expanded.includes(idx)
                      && (
                        <tr key={`expanded_${idx}`}>
                          <td colSpan={fields.length + 1}>{ onExpand(idx, row) }</td>
                        </tr>
                      )
                    }
                  </Fragment>
                ))}
              </tbody>
            </table>
          </Col>
        </Row>
      </Container>
      <div ref={ref} />
    </>
  );
};
