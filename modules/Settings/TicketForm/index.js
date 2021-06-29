import React, { memo } from 'react'
import { Route, Switch, useParams, useRouteMatch, Link } from 'react-router-dom'
import moment from 'moment'
import { DocumentTitle } from 'modules/utils/DocumentTitle'
import { Button, Table } from 'react-bootstrap'
import { useTranslation, Trans } from 'react-i18next'
import PropTypes from 'prop-types'
import { useQuery, useMutation } from 'react-query'
import { http } from 'lib/leancloud'
import { useAppContext } from 'modules/context'
import { NoDataRow } from 'modules/components/NoData'
import Pagination, { usePagination } from 'modules/components/Pagination'
import Confirm from 'modules/components/Confirm'
import { AddForm, EditorForm } from './FormPage'
import styles from './index.module.scss'

export const useFormId = () => {
  return useParams().id
}

const FieldRow = memo(({ data, onDeleted }) => {
  const { t } = useTranslation()
  const match = useRouteMatch()
  const { addNotification } = useAppContext()
  const { title, id, updatedAt } = data
  const { mutateAsync, isLoading } = useMutation({
    mutationFn: () => http.delete(`/api/1/ticket-forms/${id}`),
    onSuccess: () => {
      addNotification({
        message: t('delete.successfully'),
      })
      onDeleted()
    },
    onError: (err) => addNotification(err),
  })
  const TitleConfirm = () => <code>{title}</code>
  return (
    <tr>
      <td>{title}</td>
      <td>{moment(updatedAt).format('YYYY-MM-DD HH:MM')}</td>
      <td>
        <Button variant="link" size="sm" as={Link} to={`${match.path}/${id}`}>
          {t('edit')}
        </Button>
        <Confirm
          header={
            <Trans
              i18nKey="ticketField.delete"
              components={{
                Title: <TitleConfirm />,
              }}
            />
          }
          danger
          onConfirm={mutateAsync}
          confirmButtonText={t('delete')}
          content={t('ticketForm.deleteHint')}
          trigger={
            <Button variant="link" size="sm" className="text-danger" disabled={isLoading}>
              {t('delete')}
            </Button>
          }
        />
      </td>
    </tr>
  )
})

FieldRow.propTypes = {
  data: PropTypes.object.isRequired,
  onDeleted: PropTypes.func.isRequired,
}

const FormList = memo(() => {
  const { t } = useTranslation()
  const match = useRouteMatch()
  const { addNotification } = useAppContext()
  const { skip, pageSize } = usePagination()
  const {
    data: [forms, count],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['setting/ticketForms', skip, pageSize],
    queryFn: () =>
      http.get('/api/1/ticket-forms', {
        params: {
          size: pageSize,
          skip,
        },
      }),
    initialData: [[], 0],
    keepPreviousData: true,
    onError: (error) => addNotification(error),
  })
  return (
    <div>
      <div>
        <div className="mb-3">
          <DocumentTitle title={`${t('ticketForm')} - LeanTicket`} />
          <Link to={`${match.path}/new`}>
            <Button variant="primary">{t('ticketForm.add')}</Button>
          </Link>
        </div>
        <Table size="sm" className={styles.table}>
          <thead>
            <tr>
              <th>{t('name')}</th>
              <th>{t('updated')}</th>
              <th>{t('operation')}</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((fieldData) => (
              <FieldRow data={fieldData} key={fieldData.id} onDeleted={refetch} />
            ))}
            {!isFetching && forms.length === 0 && <NoDataRow />}
          </tbody>
        </Table>
        {count > 0 && <Pagination count={count} />}
      </div>
    </div>
  )
})

export default function TicketFields() {
  const match = useRouteMatch()
  return (
    <Switch>
      <Route path={`${match.path}/new`} component={AddForm} />
      <Route path={`${match.path}/:id`} component={EditorForm} />
      <Route component={FormList} />
    </Switch>
  )
}