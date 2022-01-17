import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, {
  FC, MutableRefObject, useEffect, useRef, useState,
} from 'react';
import { Col, Container, Row } from 'react-bootstrap';

export interface Field {
  name: string;
  identifier: string;
  width?: number;
  formatter?: (val: any, name: string, row: any[]) => string | JSX.Element;
  editable?: boolean;
  type?: 'button' | 'checkbox' | 'color' | 'date' | 'datetime' | 'email' | 'file' | 'hidden' |
    'image' | 'month' | 'number' | 'password' | 'radio' | 'range' | 'reset' | 'search' | 'submit'
    | 'tel' | 'text' | 'time' | 'url' | 'week'
}

export interface DatatableProps {
  fields: Field[]
  data: any[],
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

export const SimpleTable: FC<DatatableProps> = (props) => {
  const { fields, data } = props;
  const [tableData, setTableData] = useState<any[]>();
  const [sortedBy, setSortedBy] = useState<{field: Field, dir: string}>();
  const [filter, setFilter] = useState<string>('');
  const [editable, setEditble] = useState<{index: number, field: Field, name: string}>();
  const [maxIdx, setMaxId] = useState<number>(10);
  const ref = useRef(null);
  const inViewPort = useIntersection(ref);

  const asc = (sotData: any[], field: Field) => {
    return sotData.sort(
      (a, b) => (a[field.identifier] > b[field.identifier] ? 1 : -1),
    ).map((i) => i);
  };

  const desc = (sortData: any[], field: Field) => {
    return sortData.sort(
      (a, b) => (a[field.identifier] < b[field.identifier] ? 1 : -1),
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
      setMaxId(maxIdx + 50);
    }

    if (data) {
      const enriched = data.map(
        (item) => ({
          ...item,
          sortHash: Object.entries(item).map(
            (i: any) => `${i[1]}`.toLowerCase(),
          ).join(' '),
        }),
      ).filter((item) => item.sortHash.includes(filter.toLocaleLowerCase()) || filter === '');
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

  const getIcon = () => ((sortedBy?.dir === 'a')
    ? <FontAwesomeIcon icon={faAngleUp} />
    : <FontAwesomeIcon icon={faAngleDown} />);

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <input className="form-control mb-3" placeholder="Filter" type="text" onChange={(v) => setFilter(v.target.value)} />
          </Col>
          <Col className='d-flex flex-row-reverse mt-2'>
            {tableData?.length}
            {' '}
            Einträge
          </Col>
        </Row>
        <Row>
          <Col>
            <table className="table">
              <thead>
                <tr>
                  { fields.map((field, idx) => {
                    const dirIdentifier = (field.identifier === sortedBy?.field.identifier)
                      ? getIcon()
                      : '';
                    return (
                      <th scope="col" style={{ cursor: 'pointer' }} key={idx} onClick={() => sortData(field)}>
                        {field.name}
                        {' '}
                        {dirIdentifier}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {tableData && tableData.map((row, idx) => {
                  if (idx <= maxIdx) {
                    return (
                      <tr key={idx}>
                        { fields.map((field, i) => {
                          const val = field.formatter
                            ? field.formatter(row[field.identifier], field.identifier, row)
                            : row[field.identifier];
                          if (editable && editable.index === idx && editable.name === field.identifier) {
                            return (
                              <td style={{ width: field.width || 150 }} key={i}>
                                <input
                                  type={field.type ? field.type : 'text'}
                                  onChange={(e) => handleEditCell(idx, e.target.value, field)}
                                  className="form-control"
                                  value={val}
                                  onBlur={() => setEditble(undefined)}
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
                    );
                  }
                })}
              </tbody>
            </table>
          </Col>
        </Row>
      </Container>
      <div ref={ref} />
    </>
  );
};
