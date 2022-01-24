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
  lang?: string,
  identifier?: string,
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

const useCustomSearch = () => {
  const [search, setSearch] = useSearchParams();
  const searchAsObject = Object.fromEntries(search);
  return [searchAsObject, setSearch] as const;
}

export const SimpleTable: FC<DatatableProps> = (props) => {
  const {
    fields, data, onExpand, showFilter, identifier = 'filter', lang = 'en',
  } = props;
  const [tableData, setTableData] = useState<any[]>();
  const [sortedBy, setSortedBy] = useState<{field: Field, dir: string}>();
  const [searchParams, setSearchParams] = useCustomSearch();
  const [filter, setFilter] = useState<string>(searchParams[identifier] || '');

  const [editable, setEditble] = useState<{index: number, field: Field, name: string}>();
  const [maxIdx, setMaxId] = useState<number>(1000);
  const [expanded, setExpanded] = useState<number[]>([]);

  const ref = useRef(null);
  const inViewPort = useIntersection(ref);

  const i = new i18n(lang);

  const handleFilterChange = (val: string) => {
    setSearchParams({...searchParams, [identifier]: val });
    setFilter(val);
  };

  const getDisplayValue = (field: Field, row: any) => {
    if (!field.formatter) {
      return row[field.identifier];
    }
    return field.formatter(row[field.identifier], field.name, row);
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
    if (inViewPort && data && maxIdx <= data.length) {
      setMaxId(maxIdx + 100);
    }

    if (data) {
      let enriched = data;

      if (showFilter) {
        enriched = data.map((item) => {
          return {
            ...item,
            filterHash: fields.map(
              (field: Field) => `${getFilterValue(field, item)}`.toLowerCase()).join(' '),
          };
        }).filter((item) => item.filterHash.includes(filter.toLocaleLowerCase()) || filter === '');
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
  }, [data, filter, inViewPort, maxIdx]);

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

  return (
    <>
      <Container fluid>
        <Row>
          { showFilter
            && (
            <Col>
              <input
                className="form-control mb-3"
                placeholder="Filter"
                value={filter}
                type="text"
                onChange={(v) => handleFilterChange(v.target.value)}
              />
            </Col>
            )}
          <Col className="d-flex flex-row-reverse mt-2">
            {tableData?.length}
            {' '}
            { i('results') }
          </Col>
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
                          )}
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
