import { dto } from './dto.js';
import { card } from './card.js';
import { util } from './util.js';
import { theme } from './theme.js';
import { session } from './session.js';
import { storage } from './storage.js';
import { pagination } from './pagination.js';
import { request, HTTP_GET, HTTP_POST, HTTP_DELETE, HTTP_PUT } from './request.js';

export const comment = (() => {

    const owns = storage('owns');
    const user = storage('user');
    const showHide = storage('comment');

    const remove = async (button) => {
        if (!confirm('Are you sure?')) {
            return;
        }

        const id = button.getAttribute('data-uuid');

        if (session.isAdmin()) {
            owns.set(id, button.getAttribute('data-own'));
        }

        changeButton(id, true);
        const btn = util.disableButton(button);
        const like = document.querySelector(`[onclick="like.like(this)"][data-uuid="${id}"]`);
        like.disabled = true;

        const status = await request(HTTP_DELETE, '/api/comment/' + owns.get(id))
            .token(session.getToken())
            .send()
            .then((res) => res.data.status, () => false);

        if (!status) {
            btn.restore();
            like.disabled = false;
            return;
        }

        document.querySelectorAll('a[onclick="comment.showOrHide(this)"]').forEach((n) => {
            const oldUuids = n.getAttribute('data-uuids').split(',');

            if (oldUuids.find((i) => i === id)) {
                const uuids = oldUuids.filter((i) => i !== id).join(',');

                if (uuids.length === 0) {
                    n.remove();
                } else {
                    n.setAttribute('data-uuids', uuids);
                }
            }
        });

        owns.unset(id);
        document.getElementById(id).remove();
    };

    const changeButton = (id, disabled) => {
        const buttonMethod = ['reply', 'edit', 'remove'];

        buttonMethod.forEach((v) => {
            const status = document.querySelector(`[onclick="comment.${v}(this)"][data-uuid="${id}"]`);
            if (status) {
                status.disabled = disabled;
            }
        });
    };

    const update = async (button) => {
        const id = button.getAttribute('data-uuid');

        let isPresent = false;
        const presence = document.getElementById(`form-inner-presence-${id}`);
        if (presence) {
            presence.disabled = true;
            isPresent = presence.value === "1";
        }

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);

        let isChecklist = false;
        const badge = document.getElementById(`badge-${id}`);
        if (badge) {
            isChecklist = badge.classList.contains('text-success');
        }

        if (id && form.value === form.getAttribute('data-original') && isChecklist === isPresent) {
            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();
            return;
        }

        form.disabled = true;

        const cancel = document.querySelector(`[onclick="comment.cancel('${id}')"]`);
        if (cancel) {
            cancel.disabled = true;
        }

        const btn = util.disableButton(button);

        const status = await request(HTTP_PUT, '/api/comment/' + owns.get(id))
            .token(session.getToken())
            .body({
                presence: presence ? isPresent : null,
                comment: form.value
            })
            .send()
            .then((res) => res.data.status, () => false);

        form.disabled = false;
        if (cancel) {
            cancel.disabled = false;
        }

        if (presence) {
            presence.disabled = false;
        }

        btn.restore();

        if (status) {
            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();
            document.getElementById(`content-${id}`).innerHTML = card.convertMarkdownToHTML(util.escapeHtml(form.value));

            if (!presence || !badge) {
                return;
            }

            if (isPresent) {
                badge.classList.remove('fa-circle-xmark', 'text-danger');
                badge.classList.add('fa-circle-check', 'text-success');
                return;
            }

            badge.classList.remove('fa-circle-check', 'text-success');
            badge.classList.add('fa-circle-xmark', 'text-danger');
        }
    };

    const send = async (button) => {
        const id = button.getAttribute('data-uuid');

        const name = document.getElementById('form-name');
        let nameValue = name.value;

        if (session.isAdmin()) {
            nameValue = user.get('name');
        }

        if (nameValue.length == 0) {
            alert('Please fill name');
            return;
        }

        if (!id && name && !session.isAdmin()) {
            name.disabled = true;
        }

        const presence = document.getElementById('form-presence');
        if (!id && presence && presence.value == "0") {
            alert('Please select presence');
            return;
        }

        if (presence && presence.value != "0") {
            presence.disabled = true;
        }

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);
        form.disabled = true;

        const cancel = document.querySelector(`[onclick="comment.cancel('${id}')"]`);
        if (cancel) {
            cancel.disabled = true;
        }

        const btn = util.disableButton(button);

        const response = await request(HTTP_POST, '/api/comment')
            .token(session.getToken())
            .body(dto.postCommentRequest(id, nameValue, presence ? presence.value === "1" : true, form.value))
            .send(dto.postCommentResponse)
            .then((res) => res, () => null);

        if (name) {
            name.disabled = false;
        }

        form.disabled = false;
        if (cancel) {
            cancel.disabled = false;
        }

        if (presence) {
            presence.disabled = false;
        }

        btn.restore();

        if (!response || response.code !== 201) {
            return;
        }

        owns.set(response.data.uuid, response.data.own);
        form.value = null;

        if (presence) {
            presence.value = "0";
        }

        if (!id) {
            const newPage = await pagination.reset();
            if (newPage) {
                scroll();
                return;
            }

            response.data.is_admin = session.isAdmin();
            const length = document.getElementById('comments').children.length;
            pagination.setResultData(length);

            if (length == pagination.getPer()) {
                document.getElementById('comments').lastElementChild.remove();
            }

            document.getElementById('comments').innerHTML = card.renderContent(response.data) + document.getElementById('comments').innerHTML;
            scroll();
        }

        if (id) {
            showHide.set('hidden', showHide.get('hidden').concat([dto.commentShowMore(response.data.uuid, true)]));
            showHide.set('show', showHide.get('show').concat([id]));

            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();

            response.data.is_admin = session.isAdmin();
            document.getElementById(`reply-content-${id}`).insertAdjacentHTML('beforeend', card.renderInnerContent(response.data));

            const containerDiv = document.getElementById(`button-${id}`);
            const anchorTag = containerDiv.querySelector('a');
            const uuids = [response.data.uuid];

            if (anchorTag) {
                if (anchorTag.getAttribute('data-show') === 'false') {
                    anchorTag.setAttribute('data-uuids', anchorTag.getAttribute('data-uuids') + ',' + uuids.join(','));
                    anchorTag.innerHTML = `Hide replies (${anchorTag.getAttribute('data-uuids').split(',').length})`;
                    anchorTag.setAttribute('data-show', 'true');
                } else {
                    anchorTag.setAttribute('data-uuids', anchorTag.getAttribute('data-uuids') + ',' + uuids.join(','));
                }
            } else {
                containerDiv.insertAdjacentHTML('beforeend', card.renderReadMore(id, uuids));
            }
        }
    };

    const cancel = (id) => {
        const name = document.getElementById('form-name');
        if (name) {
            name.disabled = false;
        }

        const presence = document.getElementById('form-presence');
        if (presence) {
            presence.disabled = false;
        }

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);
        form.disabled = false;

        if (id) {
            changeButton(id, false);
        }

        document.getElementById(`inner-${id}`).remove();
    };

    const reply = (button) => {
        const id = button.getAttribute('data-uuid');
        changeButton(id, true);

        const inner = card.renderReply(id);
        document.getElementById(`reply-content-${id}`).insertAdjacentElement('beforeend', inner);
    };

    const edit = async (button) => {
        const id = button.getAttribute('data-uuid');
        changeButton(id, true);

        const content = document.getElementById(`content-${id}`).innerHTML;
        const presence = document.getElementById(`badge-${id}`).classList.contains('text-success');

        const inner = card.renderEdit(id, presence);
        document.getElementById(id).insertAdjacentElement('beforeend', inner);

        const form = document.getElementById(`form-inner-${id}`);
        form.value = content.replace(/<[^>]*>/g, '');
        form.setAttribute('data-original', form.value);
    };

    const comment = () => {
        request(HTTP_GET, '/api/comment').token(session.getToken()).send().then((res) => {
            if (res.code !== 200) {
                return;
            }

            const comments = document.getElementById('comments');
            comments.innerHTML = '';

            res.data.forEach((item) => {
                item.is_admin = session.isAdmin();
                comments.innerHTML += card.renderContent(item);
            });

            res.data.forEach((item) => {
                const traverse = (items, hide) => {
                    items.forEach((i) => {
                        hide.push(dto.commentShowMore(i.uuid, true));
                        traverse(i.comments, hide);
                    });
                };

                traverse(item.comments, showHide.get('hidden'));
            });

            card.fetchTracker(res.data);
        });
    };

    const showOrHide = (button) => {
        const id = button.getAttribute('data-uuid');
        const uuids = button.getAttribute('data-uuids').split(',');
        const show = button.getAttribute('data-show') === 'true';

        showHide.get('hidden').forEach((item) => {
            if (uuids.includes(item.uuid)) {
                item.show = !show;
            }
        });

        showHide.set('show', show ? showHide.get('show').filter((i) => i !== id) : showHide.get('show').concat([id]));

        button.setAttribute('data-show', !show);
        button.innerHTML = show ? `Show replies (${uuids.length})` : 'Hide replies';

        uuids.forEach((uuid) => {
            const element = document.getElementById(uuid);
            if (element) {
                element.classList.toggle('d-none');
            }
        });
    };

    const scroll = () => document.getElementById('comments').scrollIntoView({ behavior: 'smooth' });

    return {
        remove,
        update,
        send,
        cancel,
        reply,
        edit,
        comment,
        showOrHide,
        scroll
    };
})();