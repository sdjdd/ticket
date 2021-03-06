import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Form, FormGroup, ControlLabel, FormControl, InputGroup, Checkbox, Radio, Button, OverlayTrigger, Tooltip} from 'react-bootstrap'
import {db} from '../../lib/leancloud'
import translate from '../i18n/translate'

class Tag extends Component {

  constructor(props) {
    super(props)
    this.state = {
      tagMetadata: null,
      isSubmitting: false,
    }
  }

  componentDidMount() {
    const id = this.props.params.id
    return Promise.resolve()
    .then(() => {
      if (id == 'new') {
        return {
          key: '',
          type: 'select',
          values: [],
          isPrivate: false,
          ACL: {
            'role:customerService': {write: true, read: true}
          },
        }
      } else {
        const tagMetadata = db.class('TagMetadata').object(id)
        return tagMetadata.get().then(t => t.data)
      }
    })
    .then(tagMetadata => {
      this.setState({
        tagMetadata,
      })
      return
    })
  }

  handleChangePrivate(isPrivate) {
    const tagMetadata = this.state.tagMetadata
    if (isPrivate) {
      tagMetadata.isPrivate = true
    } else {
      tagMetadata.isPrivate = false
    }
    this.setState({tagMetadata})
  }

  handleKeyChange(e) {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.key = e.target.value
    this.setState({tagMetadata})
  }

  handleTypeChange(e) {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.type = e.target.value
    this.setState({tagMetadata})
  }

  addValueItem() {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.values.push('')
    this.setState({tagMetadata})
  }

  changeValue(index, value) {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.values[index] = value
    this.setState({tagMetadata})
  }

  handleSortUpdate(value, oriIndex, newIndex) {
    const tagMetadata = this.state.tagMetadata
    const values = tagMetadata.values
    values.splice(oriIndex, 1)
    values.splice(newIndex, 0, value)
    this.setState({tagMetadata})
  }

  handleRemoveItem(index) {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.values.splice(index, 1)
    this.setState({tagMetadata})
  }

  handleRemove(t) {
    const result = confirm(t('confirmDeleteTag') + this.state.tagMetadata.key)
    if (result) {
      return db.class('TagMetaData').object(this.state.tagMetadata.objectId).delete()
      // TODO 移除相关 ticket 的标签
      .then(() => {
        this.context.refreshTagMetadatas()
        this.context.router.push('/settings/tags')
        return
      })
      .catch(this.context.addNotification)
    }
  }

  handleSubmit(e) {
    e.preventDefault()
    this.setState({isSubmitting: true})

    const tagMetadata = this.state.tagMetadata
    const ACL = db.ACL().allow('role:customerService', 'read', 'write')
    if (!tagMetadata.isPrivate) {
      ACL.allow('*', 'read')
    }
    const data = Object.assign({}, tagMetadata, { ACL })
    return Promise.resolve()
    .then(() => {
      const id = this.props.params.id
      if (id === 'new') {
        return db.class('TagMetadata').add(data)
      } else {
        return db.class('TagMetadata').object(tagMetadata.objectId).update(data)
      }
    })
    .then(() => {
      this.setState({isSubmitting: false})
      this.context.refreshTagMetadatas()
      this.context.router.push(`/settings/tags/${tagMetadata.id}`)
      return
    })
    .then(this.context.addNotification)
    .catch(this.context.addNotification)
  }

  render() {
    const {t} = this.props
    const tagMetadata = this.state.tagMetadata
    if (!tagMetadata) {
      return <div>{t('loading')}……</div>
    }

    return <Form onSubmit={this.handleSubmit.bind(this)}>
      <FormGroup controlId="tagNameText">
        <ControlLabel>{t('tagName')}</ControlLabel>
        <FormControl type="text" value={tagMetadata.key} onChange={this.handleKeyChange.bind(this)} />
      </FormGroup>
      <FormGroup>
        <ControlLabel>{t('permission')}</ControlLabel>
        <Checkbox
          checked={tagMetadata.isPrivate}
          onChange={(e) => this.handleChangePrivate(e.target.checked)}>
          {t('private')}
          {' '}<OverlayTrigger placement="right" overlay={
            <Tooltip id="tooltip">
              {t('privateInfo')}
            </Tooltip>}>
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </OverlayTrigger>
        </Checkbox>
      </FormGroup>
      <FormGroup>
        <ControlLabel>{t('type')}</ControlLabel>
        <Radio name="tagTypeGroup" value='select' checked={tagMetadata.type == 'select'} onChange={this.handleTypeChange.bind(this)}>
          {t('tagTypeSelect')}
          {' '}<OverlayTrigger placement="right" overlay={
            <Tooltip id="tooltip">
              {t('tagTypeSelectInfo')}
            </Tooltip>}>
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </OverlayTrigger>
        </Radio>
        <Radio name="tagTypeGroup" value="text" checked={tagMetadata.type == 'text'} onChange={this.handleTypeChange.bind(this)}>
          {t('tagTypeAnyText')}
          {' '}<OverlayTrigger placement="right" overlay={
            <Tooltip id="tooltip">
              {t('tagTypeAnyTextInfo')}
            </Tooltip>}>
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </OverlayTrigger>
        </Radio>{' '}
      </FormGroup>
      {tagMetadata.type == 'select' &&
        <FormGroup>
          <ControlLabel>{t('predefinedTags')}</ControlLabel>
          {tagMetadata.values.map((value, index, array) => {
            return <InputGroup key={index}>
                <FormControl type='text' value={value} onChange={(e) => this.changeValue(index, e.target.value)} />
                <InputGroup.Button>
                  <Button disabled={index == 0} onClick={() => this.handleSortUpdate(value, index, index - 1)}><span className="glyphicon glyphicon glyphicon-chevron-up" aria-hidden="true" /></Button>
                  <Button disabled={index == array.length - 1} onClick={() => this.handleSortUpdate(value, index, index + 1)}><span className="glyphicon glyphicon glyphicon-chevron-down" aria-hidden="true" /></Button>
                  <Button onClick={() => this.handleRemoveItem(index)}><span className="glyphicon glyphicon-remove" aria-hidden="true" /></Button>
                </InputGroup.Button>
              </InputGroup>
          })}
          <Button type='button' onClick={this.addValueItem.bind(this)}><span className="glyphicon glyphicon glyphicon-plus" aria-hidden="true" /></Button>
        </FormGroup>
      }
      <Button type='submit' bsStyle='success'>{t('save')}</Button>
      {' '}
      {this.props.params.id !== 'new'
        && <Button type='button' onClick={this.handleRemove.bind(this, t)} bsStyle="danger">{t('delete')}</Button>}
      {' '}
      <Button type='button' onClick={() => this.context.router.push('/settings/tags')}>{t('return')}</Button>
    </Form>
  }
}

Tag.propTypes = {
  params: PropTypes.object.isRequired,
  t: PropTypes.func,
}

Tag.contextTypes = {
  router: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  refreshTagMetadatas: PropTypes.func.isRequired,
}

export default translate(Tag)
