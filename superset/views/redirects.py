# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
import logging
from flask import flash
from flask_appbuilder import expose
from typing import Optional
from werkzeug.utils import redirect

from superset import db, event_logger
from superset.models import core as models
from superset.superset_typing import FlaskResponse
from superset.views.base import BaseSupersetView

logger = logging.getLogger(__name__)


class R(BaseSupersetView):  # pylint: disable=invalid-name

    """used for short urls"""

    @staticmethod
    def _validate_url(url: Optional[str] = None) -> bool:
        if url and (
            url.startswith("/superset/dashboard/")
            or url.startswith("/superset/explore/")
        ):
            return True
        return False

    @event_logger.log_this
    @expose("/<int:url_id>")
    def index(self, url_id: int) -> FlaskResponse:
        url = db.session.query(models.Url).get(url_id)
        if url and url.url:
            explore_url = "///datasuperset/explore/?"
            if url.url.startswith(explore_url):
                explore_url += f"r={url_id}"
                return redirect(explore_url[1:])
            if self._validate_url(url.url):
                return redirect(url.url[1:])
            return redirect("/")

        flash("URL to nowhere...", "danger")
        return redirect("/")
